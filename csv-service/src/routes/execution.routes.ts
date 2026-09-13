import { Router } from "express";
import { upload } from "../utils/file-upload.util";
import {
  handleExecuteTestStep,
  handleGetExecutionsByStep
} from "../controllers/execution.controller";

const router = Router();

// Step 5 Execution with Multipart Evidence Upload
router.post("/", upload.single("evidence"), handleExecuteTestStep);
router.get("/step/:stepId", handleGetExecutionsByStep);

export default router;
