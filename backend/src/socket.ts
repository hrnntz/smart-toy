import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

// Extender el tipo Socket para llevar info del usuario autenticado
interface AuthenticatedSocket extends Socket {
  userId?: number;
  userEmail?: string;
  isToyDevice?: boolean;
  familyId?: number;
}

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    maxHttpBufferSize: 1e7, // 10MB: Evita desconexión por tamaño de paquete al transmitir fotogramas de cámara
    cors: {
      // VULN-002 / VULN-003 fix: CORS restringido en Socket.io
      // Los clientes móviles nativos no envían Origin, por lo que se permiten.
      // Agregar dominios de dashboard web aquí si aplica.
      origin: (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
        .concat([undefined as unknown as string]), // permite sin Origin (móvil nativo)
      methods: ["GET", "POST"],
    },
  });

  // ─── VULN-003 fix: Autenticación JWT o Dispositivo Juguete en handshake ────
  io.use((socket: AuthenticatedSocket, next) => {
    const auth = socket.handshake.auth || {};
    const token =
      (auth.token as string) ||
      (socket.handshake.headers?.authorization as string)?.replace("Bearer ", "");

    // 1. Conexión de dispositivo juguete (Panda Inside) mediante familyId
    if (auth.role === "toy") {
      const famId = Number(auth.familyId) || 1;
      socket.userId = famId;
      socket.familyId = famId;
      socket.isToyDevice = true;
      socket.userEmail = `toy_${famId}@panda.internal`;
      console.log(`🧸 Dispositivo Juguete autenticado vía FamilyId #${famId} (Socket: ${socket.id})`);
      return next();
    }

    // 2. Conexión estándar de la aplicación de padres con JWT
    if (!token) {
      return next(new Error("Socket: token de autenticación requerido"));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error("Socket: JWT_SECRET no configurado"));
    }

    try {
      const decoded = jwt.verify(token, secret) as { userId: number; email: string };
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch {
      next(new Error("Socket: token inválido o expirado"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`🔌 Cliente conectado a Socket.io: ${socket.id} (userId: ${authSocket.userId}, isToy: ${!!authSocket.isToyDevice})`);

    // Unirse a salas de juguete o usuario
    socket.on("join:toy", (toyId: string) => {
      socket.join(`toy:${toyId}`);
      console.log(`🧸 Socket ${socket.id} se unió a la sala toy:${toyId}`);
      if (authSocket.userId) {
        io?.to(`parent:${authSocket.userId}`).emit("toy:status_changed", {
          toyId,
          isConnected: true,
          status: "ONLINE",
          timestamp: Date.now(),
        });
      }
    });

    socket.on("join:parent", (userId: string) => {
      if (String(authSocket.userId) !== String(userId)) {
        socket.emit("error", { message: "Acceso denegado: userId incorrecto" });
        return;
      }
      socket.join(`parent:${userId}`);
      console.log(`👨‍👩‍👧 Socket ${socket.id} se unió a la sala parent:${userId}`);
    });

    // Enviar evento de estado del juguete
    socket.on("toy:status_update", (data: { toyId: string; status: string; battery: number; isHugging?: boolean; hugCount?: number }) => {
      io?.to(`toy:${data.toyId}`).emit("toy:status_changed", data);
      if (authSocket.userId) {
        io?.to(`parent:${authSocket.userId}`).emit("toy:status_changed", {
          ...data,
          isConnected: true,
        });
      }
    });

    // Enviar comando directo desde la app de padres hacia el teléfono dentro del juguete
    socket.on("parent:send_command", (data: { toyId: string; command: string; payload?: any }) => {
      console.log(`📡 Comando del padre (userId:${authSocket.userId}) para toy:${data.toyId}: ${data.command}`);
      const payload = {
        action: data.command,
        payload: data.payload,
        senderId: authSocket.userId,
        timestamp: Date.now(),
      };
      io?.to(`toy:${data.toyId}`).emit("toy:command", payload);
    });

    // Eventos de chat en tiempo real / intercomunicador
    socket.on("chat:send_message", (message: { toyId: string; text: string; sender: string }) => {
      console.log(`💬 Mensaje para Panda (toy:${message.toyId}): "${message.text}" de ${message.sender}`);
      io?.to(`toy:${message.toyId}`).emit("chat:receive_message", message);
    });

    // 📹 Transmisión de Cámara por Nube en Tiempo Real
    // Convención: roomId = "<userId>-<toyId>" o "<userId>_<toyId>"
    socket.on("camera:join_stream", (roomId: string) => {
      const rId = String(roomId || "");
      const uId = String(authSocket.userId || authSocket.familyId || "");
      if (!rId || (!rId.startsWith(uId + "-") && !rId.startsWith(uId + "_") && rId !== uId)) {
        socket.emit("camera:error", { message: "Acceso denegado a la sala de cámara" });
        return;
      }
      socket.join(`camera_room:${rId}`);
      console.log(`📹 Socket ${socket.id} (userId:${authSocket.userId}, isToy:${!!authSocket.isToyDevice}) se unió a camera_room:${rId}`);

      const room = io?.sockets.adapter.rooms.get(`camera_room:${rId}`);
      const memberCount = room ? room.size : 0;
      console.log(`📹 Miembros en camera_room:${rId}: ${memberCount}`);

      if (authSocket.isToyDevice) {
        // Notificar a la sala y al padre que el juguete está en línea
        socket.to(`camera_room:${rId}`).emit("toy:camera_ready", { isReady: true });
        io?.to(`parent:${uId}`).emit("toy:status_changed", {
          isConnected: true,
          status: "ONLINE",
          timestamp: Date.now(),
        });
        // Si ya hay alguien (padre) esperando en la sala, activar captura en el juguete
        if (memberCount > 1) {
          socket.emit("camera:viewer_active", { active: true });
        }
      } else {
        // Es un padre conectándose. Si el juguete ya está en la sala, activar transmisión
        if (memberCount > 1) {
          socket.to(`camera_room:${rId}`).emit("camera:viewer_active", { active: true });
          socket.emit("toy:status_changed", { isConnected: true, status: "ONLINE" });
        }
      }
    });

    // 👁️ Señales de espectador bajo demanda (el padre entra o sale de la pantalla de supervisión)
    socket.on("camera:watch_start", (data: { roomId: string }) => {
      const rId = String(data?.roomId || "");
      const uId = String(authSocket.userId || authSocket.familyId || "");
      if (!rId || (!rId.startsWith(uId + "-") && !rId.startsWith(uId + "_") && rId !== uId)) {
        return;
      }
      console.log(`👀 Padre visualizando cámara en ${rId}. Señalando inicio de captura al juguete.`);
      socket.to(`camera_room:${rId}`).emit("camera:viewer_active", { active: true });
    });

    socket.on("camera:watch_stop", (data: { roomId: string }) => {
      const rId = String(data?.roomId || "");
      const uId = String(authSocket.userId || authSocket.familyId || "");
      if (!rId || (!rId.startsWith(uId + "-") && !rId.startsWith(uId + "_") && rId !== uId)) {
        return;
      }
      console.log(`🛑 Espectador cerró supervisión en ${rId}. Pausando cámara del juguete.`);
      socket.to(`camera_room:${rId}`).emit("camera:viewer_active", { active: false });
    });

    socket.on("camera:stream_frame", (data: { roomId: string; frame: string; timestamp: number }) => {
      const rId = String(data?.roomId || "");
      const uId = String(authSocket.userId || authSocket.familyId || "");
      if (!rId || (!rId.startsWith(uId + "-") && !rId.startsWith(uId + "_") && rId !== uId)) {
        socket.emit("camera:error", { message: "No autorizado para transmitir en esta sala" });
        return;
      }
      socket.to(`camera_room:${data.roomId}`).emit("camera:receive_frame", data);
    });

    socket.on("camera:stop_stream", (roomId: string) => {
      const rId = String(roomId || "");
      const uId = String(authSocket.userId || authSocket.familyId || "");
      if (!rId || (!rId.startsWith(uId + "-") && !rId.startsWith(uId + "_") && rId !== uId)) {
        socket.emit("camera:error", { message: "No autorizado" });
        return;
      }
      io?.to(`camera_room:${roomId}`).emit("camera:stream_ended");
    });

    socket.on("disconnect", () => {
      console.log(`❌ Cliente desconectado de Socket.io: ${socket.id} (isToy: ${!!authSocket.isToyDevice})`);
      if (authSocket.isToyDevice && authSocket.userId) {
        io?.to(`parent:${authSocket.userId}`).emit("toy:status_changed", {
          isConnected: false,
          status: "OFFLINE",
          timestamp: Date.now(),
        });
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io no está inicializado.");
  }
  return io;
};
