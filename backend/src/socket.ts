import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

// Extender el tipo Socket para llevar info del usuario autenticado
interface AuthenticatedSocket extends Socket {
  userId?: number;
  userEmail?: string;
}

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
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

  // ─── VULN-003 fix: Autenticación JWT en el handshake de Socket.io ────────
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.headers?.authorization as string)?.replace("Bearer ", "");

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
    console.log(`🔌 Nuevo cliente conectado a Socket.io: ${socket.id}`);

    // Unirse a salas de juguete o usuario
    socket.on("join:toy", (toyId: string) => {
      socket.join(`toy:${toyId}`);
      console.log(`Socket ${socket.id} se unió a la sala toy:${toyId}`);
    });

    socket.on("join:parent", (userId: string) => {
      const authSocket = socket as AuthenticatedSocket;
      if (String(authSocket.userId) !== String(userId)) {
        socket.emit("error", { message: "Acceso denegado: userId incorrecto" });
        return;
      }
      socket.join(`parent:${userId}`);
      console.log(`Socket ${socket.id} se unió a la sala parent:${userId}`);
    });

    // Enviar evento de estado del juguete
    socket.on("toy:status_update", (data: { toyId: string; status: string; battery: number }) => {
      io?.to(`toy:${data.toyId}`).emit("toy:status_changed", data);
      io?.to(`parent:${data.toyId}`).emit("toy:status_changed", data);
    });

    // Eventos de chat en tiempo real
    socket.on("chat:send_message", (message: { toyId: string; text: string; sender: string }) => {
      io?.to(`toy:${message.toyId}`).emit("chat:receive_message", message);
    });

    // 📹 Transmisión de Cámara por Nube en Tiempo Real
    // VULN-003 fix: Validar que el roomId pertenece al usuario autenticado.
    // Convención: roomId = "<userId>-<toyId>" o cualquier string que empiece con el userId.
    socket.on("camera:join_stream", (roomId: string) => {
      const authSocket = socket as AuthenticatedSocket;
      // Verifica que el roomId empiece con el userId para prevenir acceso cruzado
      if (!roomId || !roomId.toString().startsWith(String(authSocket.userId) + "-")) {
        socket.emit("camera:error", { message: "Acceso denegado a la sala de cámara" });
        return;
      }
      socket.join(`camera_room:${roomId}`);
      console.log(`📹 Socket ${socket.id} (userId:${authSocket.userId}) se unió a camera_room:${roomId}`);
    });

    socket.on("camera:stream_frame", (data: { roomId: string; frame: string; timestamp: number }) => {
      const authSocket = socket as AuthenticatedSocket;
      if (!data?.roomId || !data.roomId.toString().startsWith(String(authSocket.userId) + "-")) {
        socket.emit("camera:error", { message: "No autorizado para transmitir en esta sala" });
        return;
      }
      socket.to(`camera_room:${data.roomId}`).emit("camera:receive_frame", data);
    });

    socket.on("camera:stop_stream", (roomId: string) => {
      const authSocket = socket as AuthenticatedSocket;
      if (!roomId || !roomId.toString().startsWith(String(authSocket.userId) + "-")) {
        socket.emit("camera:error", { message: "No autorizado" });
        return;
      }
      io?.to(`camera_room:${roomId}`).emit("camera:stream_ended");
    });

    socket.on("disconnect", () => {
      console.log(`❌ Cliente desconectado de Socket.io: ${socket.id}`);
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
