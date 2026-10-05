import { Router, Request, Response, NextFunction } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
  getGxpUserContext,
  hasPermission
} from "../services/user-context.service";
import {
  createRole,
  listPermissions,
  lookupRoles,
  queryRoles,
  removeRoles,
  updateRole,
  BackendRole
} from "../services/backend-roles.client";

/** GXP Roles screen. Role definitions are stored in backend; GXP checks the caller's own
 * GXP permissions before every read and change, so GXP admins manage GXP roles. */

const router: Router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("ROLE", action);

const GXP_OPERATE_ALL = "GXP:OPERATE:ALL";

const shape = (role: BackendRole) => ({
  id: role.id,
  _id: role.id,
  name: role.name,
  description: role.description,
  permissions: role.permissions.map((name) => ({ name }))
});

const actorOf = (req: Request) => ({
  id: req.user?.id,
  email: req.user?.email
});

/** The form sends permission ids from the picker; backend stores by name. */
const permissionNames = async (
  requested: unknown
): Promise<string[] | undefined> => {
  if (!Array.isArray(requested)) return undefined;
  const catalogue = await listPermissions();
  const byId = new Map(catalogue.map((p) => [p.id, p.name]));
  return requested
    .filter((value): value is string => typeof value === "string")
    .map((value) => byId.get(value) ?? value);
};

/** The list also feeds the GXP Users form's role picker, so whoever may create or edit
 * GXP users can read it too, not only role viewers. */
const canListRoles = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const context = await getGxpUserContext(req.user!.id);
    const allowed = ["GXP:VIEW:ROLE", "GXP:CREATE:USER", "GXP:UPDATE:USER"];
    if (context && allowed.some((code) => hasPermission(context, code))) {
      return next();
    }
    res
      .status(403)
      .json({ message: "You do not have permission to view role records." });
  }
);

/** Nobody can grant GXP permissions they don't hold themselves. */
const preventRoleEscalation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const names = await permissionNames(req.body?.permissions);
    if (!names?.length) return next();
    const context = await getGxpUserContext(req.user!.id, {
      allowGrace: false
    });
    const holdsAll =
      context?.isSuperAdmin || context?.permissions.has(GXP_OPERATE_ALL);
    if (holdsAll) return next();
    const disallowed = names.filter(
      (name) => !context || !hasPermission(context, name)
    );
    if (disallowed.length) {
      return res.status(403).json({
        message: `You cannot grant permissions you don't hold yourself: ${disallowed.join(", ")}`
      });
    }
    next();
  }
);

router.get(
  "/permissions",
  can("VIEW"),
  asyncHandler(async (_req: Request, res: Response) => {
    const permissions = (await listPermissions()).map((p) => ({
      ...p,
      _id: p.id
    }));
    res.status(200).json({
      permissions,
      metadata: {
        totalCount: permissions.length,
        currentPage: 1,
        limit: permissions.length,
        totalPages: 1
      }
    });
  })
);

router.get(
  "/",
  canListRoles,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 20));
    const { rows, count } = await queryRoles({
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy : "name",
      sortDir:
        String(req.query.sortDir ?? "").toUpperCase() === "DESC"
          ? "DESC"
          : "ASC",
      page,
      limit
    });
    res.status(200).json({
      roles: rows.map(shape),
      metadata: {
        totalCount: count,
        currentPage: page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  })
);

router.get(
  "/:id",
  can("VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const [role] = await lookupRoles([String(req.params.id)]);
    if (!role || role.isRemoved) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json({ role: shape(role) });
  })
);

router.post(
  "/",
  can("CREATE"),
  preventRoleEscalation,
  asyncHandler(async (req: Request, res: Response) => {
    const role = await createRole(
      {
        name: req.body?.name,
        description: req.body?.description,
        permissions: (await permissionNames(req.body?.permissions)) ?? []
      },
      actorOf(req)
    );
    res
      .status(201)
      .json({ message: "Role created successfully", role: shape(role) });
  })
);

/** Ids, or "everything matching this search" minus `excludeIds` (select-all mode). */
const selectedIds = async (body: Record<string, any>): Promise<string[]> => {
  if (Array.isArray(body?.ids)) return body.ids;
  const { rows } = await queryRoles({ search: body?.search, limit: 500 });
  const excluded = new Set<string>(body?.excludeIds ?? []);
  return rows.map((r) => r.id).filter((id) => !excluded.has(id));
};

router.post(
  "/bulk-delete",
  can("DELETE"),
  asyncHandler(async (req: Request, res: Response) => {
    const count = await removeRoles(await selectedIds(req.body), actorOf(req));
    res.status(200).json({ message: `${count} role(s) deleted`, count });
  })
);

router.patch(
  "/:id",
  can("UPDATE"),
  preventRoleEscalation,
  asyncHandler(async (req: Request, res: Response) => {
    const role = await updateRole(
      String(req.params.id),
      {
        ...(req.body?.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body?.description !== undefined
          ? { description: req.body.description }
          : {}),
        ...(Array.isArray(req.body?.permissions)
          ? { permissions: await permissionNames(req.body.permissions) }
          : {})
      },
      actorOf(req)
    );
    res
      .status(200)
      .json({ message: "Role updated successfully", role: shape(role) });
  })
);

router.delete(
  "/:id",
  can("DELETE"),
  asyncHandler(async (req: Request, res: Response) => {
    const count = await removeRoles([String(req.params.id)], actorOf(req));
    if (!count) return res.status(404).json({ message: "Role not found" });
    res.status(200).json({ message: "Role deleted successfully" });
  })
);

export default router;
