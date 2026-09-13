import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as exporterService from "../services/audit-exporter.service";

export const handleExportAuditPackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await exporterService.generateAuditPackageZip(id, res);
  } catch (error) {
    next(error);
  }
};
