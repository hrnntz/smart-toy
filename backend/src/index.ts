import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { AppDataSource } from "./config/database";
import { initSocketServer } from "./socket";

import authRoutes from "./routes/auth";
import childRoutes from "./routes/child";
import toyRoutes from "./routes/toy";
import rutinaRoutes from "./routes/rutina";
import messageRoutes from "./routes/message";
import storyRoutes from "./routes/story";
import configRoutes from "./routes/config";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Inicializar Socket.io
initSocketServer(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Smart Toy Backend funcionando",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/child", childRoutes);
app.use("/api/toy", toyRoutes);
app.use("/api/rutina", rutinaRoutes);
app.use("/api/toy", messageRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/config", configRoutes);

// Base de datos + servidor
AppDataSource.initialize()
  .then(() => {
    console.log("PostgreSQL conectado correctamente");
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Smart Toy Backend ejecutándose en http://localhost:${PORT}`);
      console.log(`📡 Socket.io y HTTP escuchando en la IP local :${PORT}`);
    });
  })
  .catch((error: any) => {
    console.error("Error conectando a PostgreSQL:", error);
    process.exit(1);
  });