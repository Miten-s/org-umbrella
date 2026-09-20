import { Request, Response, NextFunction } from "express";
import GxpUser from "../models/gxp-service-users.model";
import { fetchPermissionNamesForRoleIds } from "../services/inter-service-calls.service";

/** A service Admin must not be able to modify their own GXP access — role, or
 * enable/disable/delete of their own membership — even if their role would otherwise
 * permit it on others. Super Admin is the defined exception. Mirrors the intent of
 * lims-service's `assertNotSelf` (there, scoped to delete only; here, any access change). */
export const preventSelfModification =
  (extractTargetIds: (req: Request) => string[] | null) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.access?.isSuperAdmin) return next();

    // `null` means the extractor could not find the shape it expects. That is not the same
    // as a request that legitimately targets nobody: if we cannot see the targets but the
    // controller still can, waving it through is how a self-modification slips past.
    const extracted = extractTargetIds(req);
    if (extracted === null) {
      return res.status(400).json({
        message: "Could not determine which GXP users this request targets."
      });
    }

    const ids = extracted.filter(Boolean);
    if (ids.length === 0) return next();

    const targets = await GxpUser.findAll({ where: { id: ids } });
    const touchesSelf = targets.some(
      (target) => target.authUserId === req.user?.id
    );

    if (touchesSelf) {
      return res.status(403).json({
        message:
          "You cannot modify your own GXP access. Ask another GXP admin to do it."
      });
    }

    next();
  };

/** Pulls every `roles` array out of a request body, whichever shape it's in — a single
 * record, a bulk-copy `records[]`, or a bulk-update `updates[].payload`. Returns `null` when
 * there is no body at all, so an unreadable request is denied rather than silently passed. */
const allRoleIdsIn = (body: Record<string, any> | undefined): string[] | null => {
  if (!body) return null;
  const bodies: Record<string, any>[] = Array.isArray(body.records)
    ? body.records
    : Array.isArray(body.updates)
      ? body.updates.map(
          (u: { payload?: Record<string, any> }) => u.payload ?? {}
        )
      : [body];

  return [
    ...new Set(bodies.flatMap((b) => (Array.isArray(b.roles) ? b.roles : [])))
  ];
};

/** A GXP admin cannot assign a role bundle that grants permissions they don't themselves
 * hold — otherwise USER:UPDATE + a hand-picked role is a path to self-escalation via a
 * colleague's account, or simply granting more than one's own authority. Covers the single
 * create/update payload as well as bulk-copy/bulk-update's nested shapes. */
export const preventRoleEscalation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const roleIds = allRoleIdsIn(req.body);
  if (roleIds === null) {
    return res.status(400).json({
      message: "Could not read the roles being assigned by this request."
    });
  }

  // An empty list here is genuine: a payload that changes only status or name grants no
  // roles, so there is nothing to escalate with.
  if (roleIds.length === 0 || req.access?.isSuperAdmin) return next();

  const grantedNames = new Set(req.access?.permissions ?? []);
  const result = await fetchPermissionNamesForRoleIds(roleIds);

  if (!result.ok) {
    return res.status(503).json({
      message:
        "Unable to verify the requested role's permissions right now. Please try again."
    });
  }

  const disallowed = result.permissions.filter(
    (name) => !grantedNames.has(name)
  );

  if (disallowed.length > 0) {
    return res.status(403).json({
      message: `You cannot grant permissions you don't hold yourself: ${disallowed.join(", ")}`
    });
  }

  next();
};
