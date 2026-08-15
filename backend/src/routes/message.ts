import { Router } from "express";
import { getMessages, saveMessage } from "../controllers/messageController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/:id/messages", getMessages);
router.post("/:id/messages", saveMessage);

export default router;