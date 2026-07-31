import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { AppDataSource } from "./config/database";


import authRoutes from "./routes/auth";
import childRoutes from "./routes/child";
import toyRoutes from "./routes/toy";
import rutinaRoutes from "./routes/rutina";


dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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

// Base de datos + servidor
AppDataSource.initialize()
  .then(() => {
    console.log("PostgreSQL conectado correctamente");

    app.listen(PORT, () => {
      console.log(
        `Smart Toy Backend ejecutándose en http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("Error conectando a PostgreSQL:", error);
    process.exit(1);
  });