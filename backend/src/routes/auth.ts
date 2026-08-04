import { Router } from "express";
import {
  authStatus,
  register,
  login,
  getProfile
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validators";

const router = Router();

router.get("/", authStatus);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/profile", authenticateToken, getProfile);

export default router;