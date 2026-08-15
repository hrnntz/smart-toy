import { Router } from "express";
import { generateMusic } from "../controllers/musicController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);
router.post("/generate", generateMusic);

export default router;
