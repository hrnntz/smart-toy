import { Router } from "express";
import { toyStatus } from "../controllers/toyController";

const router = Router();

router.get("/", toyStatus);

export default router;