import { Request, Response, NextFunction } from "express";
import asyncHandler from "./error.middleware";
import { getUserContext, hasPermission } from "../services/user-context.service";
import AccessBypassLog from "../models/access-bypass-log.model";
import { LimsAction, LimsEntity, LIMS_ENTITIES } from "../utils/permissions";
import { logError } from "../configs/logger.config";

/**
 * The real access control. `authenticate` proves who you are; this proves what
 * you may do. Every entity route carries one of these — a route without it is
 * a route anyone with any valid platform token can call.
 *
 * Also the point where `req.access` is populated, which the CRUD factory then
 * uses to scope every query to the user's groups.
 *
 * Denials are 403. 404 would hide whether a record exists, but it also makes
 * every genuine misconfiguration look like a missing record, and the entity
 * list is not itself a secret here.
 */

/**
 * Records an OPERATE:ALL bypass on its own stream. Deliberately fire-and-forget:
 * an audit-stream failure must never take down the request, but it must be
 * loud in the logs.
 *
 * NOTE: this fires on EVERY request served under OPERATE:ALL, reads included,
 * which is the literal reading of "every bypass use". An admin browsing lists
 * will therefore generate a lot of rows. If that proves too noisy, restrict it
 * to mutations by gating on `req.method !== "GET"` — one line, right here.
 */
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

/**
 * @param entity Catalogue entity code, e.g. "SAMPLE". May be a function of the
 *   request for routes that serve many entities — attachments are checked
 *   against whichever parent they hang off, so attaching a file to a Sample
 *   needs Sample permission, not a separate "attachment" permission.
 * @param action The action this specific route performs. Passed explicitly
 *   rather than derived from the HTTP verb, because the verb lies:
 *   `POST /bulk-delete` deletes and `PATCH /restore/:id` is not an update.
 */
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

    req.access = context;
    next();
  });

export default authorize;
