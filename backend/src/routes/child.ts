import { Router } from "express";
import {
  childStatus,
  getChildren,
  getProfile,
  updateProfile,
  createChild,
  updateChild,
  deleteChild
} from "../controllers/childController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/", childStatus);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/all", getChildren);
router.post("/", createChild);
router.put("/:id", updateChild);
router.delete("/:id", deleteChild);

export default router;
