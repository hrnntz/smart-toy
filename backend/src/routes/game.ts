import { Router } from "express";
import { generateQuestions } from "../controllers/gameController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Minijuegos educativos disponibles con o sin token para que los niños siempre puedan jugar
router.post("/generate-questions", generateQuestions);

export default router;
