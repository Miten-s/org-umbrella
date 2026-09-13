import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as executionService from "../services/execution.service";

export const handleExecuteTestStep = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { stepId, actualResult, status } = req.body;
    if (!stepId || !actualResult || !status) {
      res
        .status(400)
        .json({ error: "stepId, actualResult, and status are required." });
      return;
    }

    if (status !== "PASS" && status !== "FAIL") {
      res.status(400).json({ error: "status must be either PASS or FAIL." });
      return;
    }

    const filePath = req.file ? req.file.path : undefined;

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "Tester"
    };

    const result = await executionService.executeTestStep(
      { stepId, actualResult, status },
      filePath,
      actor
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const handleGetExecutionsByStep = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stepId = Array.isArray(req.params.stepId)
      ? req.params.stepId[0]
      : req.params.stepId;

    const executions = await executionService.getExecutionsByStepId(stepId);
    res.status(200).json(executions);
  } catch (error) {
    next(error);
  }
};
