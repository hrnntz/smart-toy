import { Router } from "express";
import { authStatus } from "../controllers/authController";

const router = Router();

router.get("/", authStatus);

export default router;