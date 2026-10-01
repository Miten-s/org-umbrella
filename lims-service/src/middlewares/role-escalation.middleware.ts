import { Request, Response, NextFunction } from "express";
import {
  getUserContext,
  permissionCodesForRoleIds
} from "../services/user-context.service";
import { ACTION_COLUMN, LIMS_ACTIONS, OPERATE_ALL } from "../utils/permissions";

/** Flattens either payload shape (`permissions[]` codes, or the stored `entries[]` grid)
 * into `LIMS:ACTION:ENTITY` codes, same conversion role.routes.ts's normalizePayload does. */
const requestedCodes = (
  body: Record<string, any>
): { codes: string[]; operateAll: boolean } => {
  if (Array.isArray(body.permissions)) {
    const operateAll = body.permissions.includes(OPERATE_ALL);
    return {
      codes: body.permissions.filter((c: string) => c !== OPERATE_ALL),
      operateAll
    };
  }
  if (Array.isArray(body.entries)) {
    const codes = body.entries.flatMap((entry: Record<string, any>) =>
      LIMS_ACTIONS.filter((action) => entry[ACTION_COLUMN[action]]).map(
        (action) => `LIMS:${action}:${entry.entry}`
      )
    );
    return { codes, operateAll: Boolean(body.operateAll) };
  }
  return { codes: [], operateAll: Boolean(body.operateAll) };
};

/** A Lab Role editor cannot grant permissions (or OPERATE:ALL) they don't themselves hold —
 * otherwise UPDATE:ROLE/CREATE:ROLE alone is a path to self-escalation. Runs independently
 * of the CRUD router's own `authorize("ROLE", ...)` check, since crud-factory's hooks don't
 * carry the actor's own permission set. */
export const preventRoleEscalation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const platformUserId = req.user?.id;
  if (!platformUserId)
    return res.status(401).json({ message: "Authentication required" });

  // Guards a write, so never on grace-cached permissions.
  const context = await getUserContext(platformUserId, { allowGrace: false });
  if (!context) {
    return res.status(403).json({ message: "You do not have access to LIMS." });
  }
  if (context.operateAll) return next();

  const { codes, operateAll } = requestedCodes(req.body ?? {});

  if (operateAll) {
    return res.status(403).json({
      message: "You cannot grant OPERATE:ALL — you don't hold it yourself."
    });
  }

  const disallowed = codes.filter((code) => !context.permissions.has(code));
  if (disallowed.length > 0) {
    return res.status(403).json({
      message: `You cannot grant permissions you don't hold yourself: ${disallowed.join(", ")}`
    });
  }

  next();
};

/** A Lab User admin cannot assign a Lab Role that grants permissions (or OPERATE:ALL) they
 * don't themselves hold — the assignment-side counterpart to `preventRoleEscalation` above,
 * which guards role *definition* rather than a user's role *assignment*. Accepts either a
 * single record's `roles: string[]` or a bulk-update's `updates[].payload.roles`. */
export const preventRoleAssignmentEscalation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const platformUserId = req.user?.id;
  if (!platformUserId)
    return res.status(401).json({ message: "Authentication required" });

  const bodies: Record<string, any>[] = Array.isArray(req.body?.updates)
    ? req.body.updates.map(
        (u: { payload?: Record<string, any> }) => u.payload ?? {}
      )
    : [req.body ?? {}];
  const roleIds = [
    ...new Set(bodies.flatMap((b) => (Array.isArray(b.roles) ? b.roles : [])))
  ];
  if (roleIds.length === 0) return next();

  // Guards a write, so never on grace-cached permissions.
  const context = await getUserContext(platformUserId, { allowGrace: false });
  if (!context) {
    return res.status(403).json({ message: "You do not have access to LIMS." });
  }
  if (context.operateAll) return next();

  const { permissions, operateAll } = await permissionCodesForRoleIds(roleIds);

  if (operateAll) {
    return res.status(403).json({
      message:
        "You cannot assign a role that grants OPERATE:ALL — you don't hold it yourself."
    });
  }

  const disallowed = [...permissions].filter(
    (code) => !context.permissions.has(code)
  );
  if (disallowed.length > 0) {
    return res.status(403).json({
      message: `You cannot assign a role granting permissions you don't hold yourself: ${disallowed.join(", ")}`
    });
  }

  next();
};

export default preventRoleEscalation;
