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

const router = Router();

router.use(authenticateToken);

router.get("/", toyStatus);
router.get("/all", getToys);
router.post("/", createToy);
router.put("/:id", updateToy);
router.delete("/:id", deleteToy);
router.patch("/:id/toggle", toggleToyConnection);
router.post("/:id/chat", chatWithToy);
router.post("/:id/voice-chat", voiceChatWithToy);

export default router;