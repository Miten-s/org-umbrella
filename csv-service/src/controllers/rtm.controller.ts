import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as rtmService from "../services/rtm.service";

export const handleGetRtmMatrix = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const summary = await rtmService.getRtmMatrixByProjectId(projectId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

export const handleSyncRtmMatrix = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const summary = await rtmService.syncRtmMatrix(projectId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};
