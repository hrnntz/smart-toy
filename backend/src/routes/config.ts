import { Router } from "express";
import {
  configStatus,
  getConfig,
  updateConfig,
  updatePushToken
} from "../controllers/configController";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateDeviceConfigSchema, updatePushTokenSchema } from "../validators";

const router = Router();

router.use(authenticateToken);

router.get("/", getConfig);
router.put("/", validate(updateDeviceConfigSchema), updateConfig);
router.post("/push-token", validate(updatePushTokenSchema), updatePushToken);
router.get("/status", configStatus);

export default router;