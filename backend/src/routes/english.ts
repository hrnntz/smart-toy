import { Router } from "express";
import {
  getThemes,
  getThemeContent,
  speak,
  checkPronunciation,
  completeTheme,
} from "../controllers/englishController";
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

router.use(authenticateToken);

router.get("/themes", getThemes);
router.get("/theme/:themeKey/content", getThemeContent);
router.post("/speak", speak);
router.post("/check-pronunciation", upload.single("audio"), checkPronunciation);
router.post("/complete-theme", completeTheme);

export default router;
