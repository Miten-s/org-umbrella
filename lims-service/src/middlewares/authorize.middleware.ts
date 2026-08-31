import { Request, Response, NextFunction } from "express";
import asyncHandler from "./error.middleware";
import { getUserContext, hasPermission } from "../services/user-context.service";
import AccessBypassLog from "../models/access-bypass-log.model";
import { LimsAction, LimsEntity, LIMS_ENTITIES } from "../utils/permissions";
import { logError } from "../configs/logger.config";

/** The real access control: `authenticate` proves who you are, this proves what you may
 * do — every entity route needs one. Also where `req.access` gets populated for the CRUD factory. */

/** Records an OPERATE:ALL bypass on its own stream, fire-and-forget — fires on every
 * request under OPERATE:ALL, reads included; gate on `req.method !== "GET"` if too noisy. */
const logBypass = (req: Request, entity: string, action: LimsAction) => {
  AccessBypassLog.create({
    performedBy: req.user?.id ?? "unknown",
    performedByName: req.user?.fullName ?? null,
    entity,
    action,
    method: req.method,
    path: req.originalUrl.split("?")[0] ?? req.originalUrl,
    requestId: (req as Request & { id?: string }).id ?? null
  }).catch((error) => logError("bypass audit write failed", { error: String(error) }));
};

/** @param entity Catalogue entity code, or a function of the request for routes serving
 * many entities (attachments check against whichever parent they hang off).
 * @param action Passed explicitly, not derived from the HTTP verb — the verb lies. */
export const authorize = (entity: string | ((req: Request) => string | undefined), action: LimsAction) =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const resolved = typeof entity === "function" ? entity(req) : entity;

    if (!resolved) {
      return res.status(400).json({ message: "entityName is required." });
    }

    if (!LIMS_ENTITIES.includes(resolved as LimsEntity)) {
      return res.status(400).json({ message: `Unknown entity "${resolved}".` });
    }

    const platformUserId = req.user?.id;

    if (!platformUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const context = await getUserContext(platformUserId);

    // A valid platform token is not LIMS access. No lims_users row, no entry.
    if (!context) {
      return res.status(403).json({
        message: "You do not have access to LIMS. Ask an administrator to create your lab user."
      });
    }

    if (!hasPermission(context, action, resolved)) {
      return res.status(403).json({
        message: `You do not have permission to ${action.toLowerCase()} ${resolved.toLowerCase().replace(/_/g, " ")} records.`
      });
    }

    if (context.operateAll) logBypass(req, resolved, action);

    // Platform token carries only `{ id, email }` — without this every audit row's "who" is null.
    if (req.user && !req.user.fullName && context.userName) {
      req.user.fullName = context.userName;
    }

    req.access = context;
    next();
  });

export default authorize;
