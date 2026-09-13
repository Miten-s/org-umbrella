import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as projectService from "../services/project.service";

export const handleCreateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appId, gxpChangeControlId, projectTitle, currentPhase, status } =
      req.body;
    if (!appId || !projectTitle) {
      res.status(400).json({ error: "appId and projectTitle are required." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const project = await projectService.createProject(
      { appId, gxpChangeControlId, projectTitle, currentPhase, status },
      actor
    );

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const handleGetProjects = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projects = await projectService.getProjects();
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

export const handleGetProjectById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const project = await projectService.getProjectById(id);
    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};
