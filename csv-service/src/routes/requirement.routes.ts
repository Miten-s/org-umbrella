import { Router } from "express";
import {
  handleCreateRequirement,
  handleGetRequirementsByProject,
  handleUpdateRequirement,
  handleDeleteRequirement
} from "../controllers/requirement.controller";

const router = Router();

// Step 2 Requirement Entry
router.post("/", handleCreateRequirement);
router.get("/project/:projectId", handleGetRequirementsByProject);
router.put("/:id", handleUpdateRequirement);
router.delete("/:id", handleDeleteRequirement);

export default router;
