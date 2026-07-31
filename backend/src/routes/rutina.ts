import { Router } from "express";
import {
  getRutinas,
  createRutina,
  updateRutina,
  deleteRutina,
} from "../controllers/rutinaController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/", getRutinas);
router.post("/", createRutina);
router.put("/:id", updateRutina);
router.delete("/:id", deleteRutina);

export default router;