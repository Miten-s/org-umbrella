import { Router } from "express";
import {
  handleGetDiscrepancies,
  handleGetDiscrepanciesByProject,
  handleGetDiscrepancyById,
  handleUpdateDiscrepancy,
  handleCloseDiscrepancy
} from "../controllers/discrepancy.controller";

const router = Router();

// Step 6 Bug Triage & Discrepancies
router.get("/", handleGetDiscrepancies);
router.get("/project/:projectId", handleGetDiscrepanciesByProject);
router.get("/:id", handleGetDiscrepancyById);
router.put("/:id", handleUpdateDiscrepancy);
router.post("/:id/close", handleCloseDiscrepancy);

export default router;
