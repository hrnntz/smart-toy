import { Router } from "express";
import {
  toyStatus,
  getToys,
  createToy,
  updateToy,
  deleteToy,
  toggleToyConnection,
  chatWithToy,
  voiceChatWithToy,
} from "../controllers/toyController";
import { authenticateToken } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

const router = Router();

router.use(authenticateToken);

router.get("/", toyStatus);
router.get("/all", getToys);
router.post("/", createToy);
router.put("/:id", updateToy);
router.delete("/:id", deleteToy);
router.patch("/:id/toggle", toggleToyConnection);
router.post("/:id/chat", chatWithToy);
router.post("/:id/voice-chat", upload.single("audio"), voiceChatWithToy);

export default router;