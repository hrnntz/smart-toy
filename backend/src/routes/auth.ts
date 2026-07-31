import { Router } from "express";
import {
  authStatus,
  register,
  login,
  getProfile
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/", authStatus);
router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);

export default router;