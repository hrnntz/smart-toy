import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth";
import childRoutes from "./routes/child";
import toyRoutes from "./routes/toy";

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

// Servidor
app.listen(PORT, () => {
  console.log(
    `🚀 Smart Toy Backend ejecutándose en http://localhost:${PORT}`
  );
});