import {
  toyStatus,
  getToys,
  createToy,
  updateToy,
  deleteToy,
  toggleToyConnection,
  chatWithToy,
  voiceChatWithToy,
  reportTelemetry,
  getToyTelemetry,
  triggerToyAction,
} from "../controllers/toyController";
import { authenticateToken } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".m4a";
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
  },
});
const upload = multer({ storage });

const router = Router();

// 📡 Ruta pública para que el ESP32 reporte telemetría con su serialNumber
router.post("/telemetry", reportTelemetry);

// Rutas protegidas para la aplicación móvil
router.use(authenticateToken);

router.get("/", toyStatus);
router.get("/all", getToys);
router.post("/", createToy);
router.put("/:id", updateToy);
router.delete("/:id", deleteToy);
router.patch("/:id/toggle", toggleToyConnection);
router.post("/:id/chat", chatWithToy);
router.post("/:id/voice-chat", upload.single("audio"), voiceChatWithToy);

// 🎮 Rutas de telemetría y control para la app de padres
router.get("/:id/telemetry", getToyTelemetry);
router.post("/:id/action", triggerToyAction);

export default router;