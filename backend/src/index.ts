import dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./config/database";
import { initSocketServer } from "./socket";

import authRoutes from "./routes/auth";
import childRoutes from "./routes/child";
import toyRoutes from "./routes/toy";
import rutinaRoutes from "./routes/rutina";
import messageRoutes from "./routes/message";
import storyRoutes from "./routes/story";
import configRoutes from "./routes/config";
import gameRoutes from "./routes/game";
import musicRoutes from "./routes/music";

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Inicializar Socket.io
initSocketServer(server);

// ─── CORS (VULN-002 fix) ───────────────────────────────────────────────────
// Solo permite orígenes explícitamente autorizados.
// Para la app móvil React Native no se necesita CORS (las peticiones nativas
// no envían Origin header), pero sí para cualquier dashboard web futuro.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin Origin (clientes móviles nativos / curl)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origen no permitido — ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── Helmet (VULN-008 fix) ──────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 63072000, // 2 años
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// ─── Rate limiting global (VULN-004 fix) ────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
});

// Límite estricto para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Máximo 20 intentos de login/registro cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiados intentos de autenticación. Intenta en 15 minutos." },
  skipSuccessfulRequests: true, // No contar logins exitosos
});

app.use(globalLimiter);
app.use(express.json({ limit: "10mb" })); // Limitar tamaño de payload
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Smart Toy Backend funcionando",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes); // Rate limit estricto en auth
app.use("/api/child", childRoutes);
app.use("/api/toy", toyRoutes);
app.use("/api/rutina", rutinaRoutes);
app.use("/api/toy", messageRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/config", configRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/music", musicRoutes);

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