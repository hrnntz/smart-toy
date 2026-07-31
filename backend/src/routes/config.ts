import { Router } from "express";
import {
  configStatus,
  getConfig,
  updateConfig
} from "../controllers/configController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/", getConfig);
router.put("/", updateConfig);
router.get("/status", configStatus);

export default router;