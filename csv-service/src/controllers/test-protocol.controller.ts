import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as protocolService from "../services/test-protocol.service";

export const handleCreateTestProtocol = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, protocolType, status } = req.body;
    if (!projectId || !protocolType) {
      res
        .status(400)
        .json({ error: "projectId and protocolType are required." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const protocol = await protocolService.createTestProtocol(
      { projectId, protocolType, status },
      actor
    );

    res.status(201).json(protocol);
  } catch (error) {
    next(error);
  }
};

export const handleCreateTestCase = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { protocolId, tcCode, title } = req.body;
    if (!protocolId || !tcCode || !title) {
      res
        .status(400)
        .json({ error: "protocolId, tcCode, and title are required." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const testCase = await protocolService.createTestCase(
      { protocolId, tcCode, title },
      actor
    );

    res.status(201).json(testCase);
  } catch (error) {
    next(error);
  }
};

export const handleCreateTestStep = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { testCaseId, stepNum, action, expectedResult } = req.body;
    if (!testCaseId || stepNum === undefined || !action || !expectedResult) {
      res.status(400).json({
        error: "testCaseId, stepNum, action, and expectedResult are required."
      });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "System User"
    };

    const step = await protocolService.createTestStep(
      { testCaseId, stepNum: Number(stepNum), action, expectedResult },
      actor
    );

    res.status(201).json(step);
  } catch (error) {
    next(error);
  }
};

export const handleGetProtocolsByProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const protocols = await protocolService.getProtocolsByProjectId(projectId);
    res.status(200).json(protocols);
  } catch (error) {
    next(error);
  }
};
