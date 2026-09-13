import { Router } from "express";
import {
  handleCreateFunctionalRisk,
  handleGetRisksByProject
} from "../controllers/risk.controller";

const router = Router();

router.post("/", handleCreateFunctionalRisk);
router.get("/project/:projectId", handleGetRisksByProject);

export default router;
