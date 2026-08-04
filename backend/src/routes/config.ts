import { Router } from "express";
import {
  configStatus,
  getConfig,
  updateConfig,
  updatePushToken
} from "../controllers/configController";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateConfigSchema, pushTokenSchema } from "../validators";

const router = Router();

router.use(authenticateToken);

router.get("/", getConfig);
router.put("/", validate(updateConfigSchema), updateConfig);
router.post("/push-token", validate(pushTokenSchema), updatePushToken);
router.get("/status", configStatus);

export default router;