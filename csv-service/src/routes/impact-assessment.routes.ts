import { Router } from "express";
import {
  handleEvaluateImpactAssessment,
  handleGetValidationPlan,
  handleApproveValidationPlan
} from "../controllers/impact-assessment.controller";

const router = Router();

// Step 3 Impact Assessment & Validation Plan
router.post("/", handleEvaluateImpactAssessment);
router.get("/project/:projectId", handleGetValidationPlan);
router.post("/:id/approve", handleApproveValidationPlan);

export default router;
