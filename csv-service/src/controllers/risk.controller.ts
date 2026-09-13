import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as riskService from "../services/risk.service";

export const handleCreateFunctionalRisk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fsId, hazardMode, severity, probability, residualRisk } = req.body;
    if (!fsId || !hazardMode || !severity || !probability || !residualRisk) {
      res.status(400).json({
        error:
          "fsId, hazardMode, severity, probability, and residualRisk are required."
      });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const risk = await riskService.createFunctionalRisk(
      { fsId, hazardMode, severity, probability, residualRisk },
      actor
    );

    res.status(201).json(risk);
  } catch (error) {
    next(error);
  }
};

export const handleGetRisksByProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const risks = await riskService.getRisksByProjectId(projectId);
    res.status(200).json(risks);
  } catch (error) {
    next(error);
  }
};
