import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Nuevo cliente conectado a Socket.io: ${socket.id}`);

    // Unirse a salas de juguete o usuario
    socket.on("join:toy", (toyId: string) => {
      socket.join(`toy:${toyId}`);
      console.log(`Socket ${socket.id} se unió a la sala toy:${toyId}`);
    });

    socket.on("join:parent", (userId: string) => {
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
