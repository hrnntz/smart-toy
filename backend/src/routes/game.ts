import { Router } from "express";
import { generateQuestions } from "../controllers/gameController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);
router.post("/generate-questions", generateQuestions);

export default router;
