import { Router } from "express";
import {
  handleCreateApplication,
  handleGetApplications
} from "../controllers/application.controller";

const router = Router();

router.post("/", handleCreateApplication);
router.get("/", handleGetApplications);

export default router;
