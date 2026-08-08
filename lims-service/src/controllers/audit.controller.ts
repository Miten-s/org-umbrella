import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { getAllAuditLogs, getAuditLogsForEntity } from "../services/audit.service";
import { getPaginationOptions } from "../utils/pagination.util";

export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = getPaginationOptions(req.query);
  const { entityName, performedBy, action } = req.query as Record<string, string>;

  const result = await getAllAuditLogs(page, limit, { entityName, performedBy, action });

  res.status(200).json({
    logs: result.logs,
    metadata: {
      totalCount: result.total,
      currentPage: page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    }
  });
});

export const getEntityAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { entityName, entityId } = req.params as Record<string, string>;
  const { page, limit } = getPaginationOptions(req.query);

  const result = await getAuditLogsForEntity(entityName, entityId, page, limit);

  res.status(200).json({
    logs: result.logs,
    metadata: {
      totalCount: result.total,
      currentPage: page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    }
  });
});
