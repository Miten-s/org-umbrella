import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as impactService from "../services/impact-assessment.service";

export const handleEvaluateImpactAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      projectId,
      patientSafety,
      productQuality,
      dataIntegrity,
      gxpProcessImpact,
      questionnaireAnswers
    } = req.body;

    if (!projectId) {
      res.status(400).json({ error: "projectId is required." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const result = await impactService.evaluateImpactAssessment(
      {
        projectId,
        patientSafety: Boolean(patientSafety),
        productQuality: Boolean(productQuality),
        dataIntegrity: Boolean(dataIntegrity),
        gxpProcessImpact:
          gxpProcessImpact !== undefined ? Boolean(gxpProcessImpact) : true,
        questionnaireAnswers
      },
      actor
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const handleGetValidationPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const plan = await impactService.getValidationPlanByProjectId(projectId);
    if (!plan) {
      res
        .status(404)
        .json({ error: `Validation Plan for project ${projectId} not found.` });
      return;
    }

    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
};

export const handleApproveValidationPlan = async (
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

    const plan = await impactService.approveValidationPlan(id, actor);
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
};
