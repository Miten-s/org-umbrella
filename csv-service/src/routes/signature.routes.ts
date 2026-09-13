import { Router } from "express";
import {
  handleCheckProjectReadiness,
  handleCreateVsrReport,
  handleSignAndApprove
} from "../controllers/signature.controller";

const router = Router();

// Step 7 Traceability Gate & 21 CFR Part 11 Signatures
router.get("/readiness/:projectId", handleCheckProjectReadiness);
router.post("/vsr", handleCreateVsrReport);
router.post("/", handleSignAndApprove);

export default router;
