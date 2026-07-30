import { Router } from "express";
import { childStatus } from "../controllers/childController";

const router = Router();

router.get("/", childStatus);

export default router;