import { Router } from "express";
import {
  handleCreateProject,
  handleGetProjects,
  handleGetProjectById
} from "../controllers/project.controller";

const router = Router();

router.post("/", handleCreateProject);
router.get("/", handleGetProjects);
router.get("/:id", handleGetProjectById);

export default router;
