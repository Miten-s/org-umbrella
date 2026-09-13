import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as discrepancyService from "../services/discrepancy.service";

export const handleGetDiscrepancies = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bugSeverity, fixStatus } = req.query;
    const discrepancies = await discrepancyService.getDiscrepancies({
      bugSeverity: typeof bugSeverity === "string" ? bugSeverity : undefined,
      fixStatus: typeof fixStatus === "string" ? fixStatus : undefined
    });
    res.status(200).json(discrepancies);
  } catch (error) {
    next(error);
  }
};

export const handleGetDiscrepanciesByProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const discrepancies =
      await discrepancyService.getDiscrepanciesByProjectId(projectId);
    res.status(200).json(discrepancies);
  } catch (error) {
    next(error);
  }
};

export const handleGetDiscrepancyById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const discrepancy = await discrepancyService.getDiscrepancyById(id);
    if (!discrepancy) {
      res.status(404).json({ error: `Discrepancy with ID ${id} not found.` });
      return;
    }
    res.status(200).json(discrepancy);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateDiscrepancy = async (
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

    const discrepancy = await discrepancyService.updateDiscrepancy(
      id,
      req.body,
      actor
    );
    res.status(200).json(discrepancy);
  } catch (error) {
    next(error);
  }
};

export const handleCloseDiscrepancy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "QA Manager"
    };

    const discrepancy = await discrepancyService.closeDiscrepancy(id, actor);
    res.status(200).json(discrepancy);
  } catch (error) {
    next(error);
  }
};
