import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as specService from "../services/spec.service";

export const handleCreateFunctionalSpec = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ursId, fsCode, flowDetails, configSpecs } = req.body;
    if (!ursId || !fsCode) {
      res.status(400).json({ error: "ursId and fsCode are required." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const spec = await specService.createFunctionalSpec(
      { ursId, fsCode, flowDetails, configSpecs },
      actor
    );

    res.status(201).json(spec);
  } catch (error) {
    next(error);
  }
};

export const handleGetFunctionalSpecsByProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const specs = await specService.getFunctionalSpecsByProjectId(projectId);
    res.status(200).json(specs);
  } catch (error) {
    next(error);
  }
};
