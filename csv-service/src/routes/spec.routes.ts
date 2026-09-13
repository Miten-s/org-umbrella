import { Router } from "express";
import {
  handleCreateFunctionalSpec,
  handleGetFunctionalSpecsByProject
} from "../controllers/spec.controller";

const router = Router();

router.post("/", handleCreateFunctionalSpec);
router.get("/project/:projectId", handleGetFunctionalSpecsByProject);

export default router;
