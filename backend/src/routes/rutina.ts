import { Router } from "express";
import {
  getRutinas,
  createRutina,
  updateRutina,
  deleteRutina,
} from "../controllers/rutinaController";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { rutinaSchema, updateRutinaSchema } from "../validators";

const router = Router();

router.use(authenticateToken);

router.get("/", getRutinas);
router.post("/", validate(rutinaSchema), createRutina);
router.put("/:id", validate(updateRutinaSchema), updateRutina);
router.delete("/:id", deleteRutina);

export default router;