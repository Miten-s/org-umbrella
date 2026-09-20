import { Request, Response, NextFunction } from "express";
import {
  getGxpUserContext,
  hasPermission
} from "../services/user-context.service";
import {
  GxpAction,
  GxpEntity,
  GXP_ENTITIES,
  permissionCode
} from "../utils/permissions";

/** The real access control: `authenticate` proves who you are, this proves what you may
 * do in GXP — every entity route needs one. Mirrors lims-service's authorize.middleware.ts. */
export const authorize = (entity: GxpEntity, action: GxpAction) => {
  if (!GXP_ENTITIES.includes(entity)) {
    throw new Error(`Unknown GXP entity "${entity}" passed to authorize().`);
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    const platformUserId = req.user?.id;
    if (!platformUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Reads may tolerate a stale grace-cache permission set during a backend outage;
    // writes must not — see getGxpUserContext's `allowGrace` doc for why.
    const context = await getGxpUserContext(platformUserId, {
      allowGrace: action === "VIEW"
    });

    // A valid platform token is not GXP access. No gxp_users row (and not Super Admin),
    // no entry.
    if (!context) {
      return res.status(403).json({
        message:
          "You do not have access to GXP. Ask an administrator to add you as a GXP user."
      });
    }

    if (!hasPermission(context, permissionCode(action, entity))) {
      return res.status(403).json({
        message: `You do not have permission to ${action.toLowerCase()} ${entity
          .toLowerCase()
          .replace(/_/g, " ")} records.`
      });
    }

    req.access = context;
    next();
  };
};

export default authorize;
