import { Request, Response, NextFunction } from "express";
import { createAuditLog } from "../services/audit.service";
import { logError } from "../configs/logger.config";

export const auditMiddleware = (
  entityName: string,
  requireChangeReason: boolean = false
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (requireChangeReason) {
      const changeReason = req.body?.changeReason || req.body?.change_reason;
      if (!changeReason || changeReason.trim() === "") {
        res.status(400).json({
          error: "changeReason is required for this operation"
        });
        return;
      }
    }

    req.auditContext = {
      ...req.auditContext,
      entityName
    };

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      setImmediate(async () => {
        try {
          const action = determineAction(req.method, req.path);
          if (!action) return;

          const entityId =
            req.auditContext?.entityId || req.params?.id || body?.data?.id || body?.id;

          if (!entityId || !req.user?.id) return;

          await createAuditLog({
            entityName,
            entityId,
            action,
            oldValue: req.auditContext?.oldValue ?? null,
            newValue: action === "DELETE" ? null : (body?.data || body || null),
            changeReason: req.body?.changeReason || req.body?.change_reason || req.auditContext?.changeReason,
            performedBy: req.user.id,
            performedByName: req.user.fullName
          });
        } catch (err) {
          logError("Audit middleware failed", { err }, "auditMiddleware", "audit.middleware.ts");
        }
      });

      return originalJson(body);
    };

    next();
  };
};

const determineAction = (method: string, path: string): "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | null => {
  if (method === "GET") return null;
  if (method === "POST") {
    if (path.includes("restore")) return "RESTORE";
    return "CREATE";
  }
  if (method === "PATCH" || method === "PUT") return "UPDATE";
  if (method === "DELETE") return "DELETE";
  return null;
};
