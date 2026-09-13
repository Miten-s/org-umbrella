import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as requirementService from "../services/requirement.service";

export const handleCreateRequirement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, ursCode, title, description, gxpFlag } = req.body;
    if (!projectId || !ursCode || !title) {
      res
        .status(400)
        .json({ error: "projectId, ursCode, and title are required." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const requirement = await requirementService.createRequirement(
      { projectId, ursCode, title, description, gxpFlag },
      actor
    );

    res.status(201).json(requirement);
  } catch (error) {
    next(error);
  }
};

export const handleGetRequirementsByProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;
    const requirements =
      await requirementService.getRequirementsByProjectId(projectId);
    res.status(200).json(requirements);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateRequirement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const requirement = await requirementService.updateRequirement(
      id,
      req.body,
      actor
    );
    res.status(200).json(requirement);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteRequirement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    await requirementService.deleteRequirement(id, actor);
    res
      .status(200)
      .json({ message: `Requirement ${id} successfully deleted.` });
  } catch (error) {
    next(error);
  }
};
