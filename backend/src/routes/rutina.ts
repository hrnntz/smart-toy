import { Router } from "express";
import {
  getRutinas,
  createRutina,
  updateRutina,
  deleteRutina,
} from "../controllers/rutinaController";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { rutinaSchema } from "../validators";

const router = Router();

router.use(authenticateToken);

router.get("/", getRutinas);
router.post("/", validate(rutinaSchema), createRutina);      // VULN-007 fix
router.put("/:id", validate(rutinaSchema), updateRutina);   // VULN-007 fix
router.delete("/:id", deleteRutina);

export default router;