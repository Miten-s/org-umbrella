import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as applicationService from "../services/application.service";

export const handleCreateApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appCode, name, gxpClassification } = req.body;
    if (!appCode || !name) {
      res.status(400).json({ error: "appCode and name are required." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const application = await applicationService.createApplication(
      { appCode, name, gxpClassification },
      actor
    );

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

export const handleGetApplications = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const applications = await applicationService.getApplications();
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};
