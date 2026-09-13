import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as signatureService from "../services/signature.service";

export const handleCheckProjectReadiness = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const readiness = await signatureService.verifyProjectReadiness(projectId);
    res.status(200).json(readiness);
  } catch (error) {
    next(error);
  }
};

export const handleCreateVsrReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, summaryText, releaseRecommendation } = req.body;
    if (!projectId || !summaryText || !releaseRecommendation) {
      res.status(400).json({
        error: "projectId, summaryText, and releaseRecommendation are required."
      });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "Validation Manager"
    };

    const vsr = await signatureService.createVsrReport(
      { projectId, summaryText, releaseRecommendation },
      actor
    );

    res.status(201).json(vsr);
  } catch (error) {
    next(error);
  }
};

export const handleSignAndApprove = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, signatureMeaning, password, mfaCode } = req.body;
    if (!projectId) {
      res.status(400).json({ error: "projectId is required for signature." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "QA Manager"
    };

    const result = await signatureService.signProjectAndApprove(
      { projectId, signatureMeaning, password, mfaCode },
      actor
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
