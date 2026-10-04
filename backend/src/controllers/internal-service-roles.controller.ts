import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import {
  ServiceRoleError,
  createServiceRole,
  getServiceRoles,
  listServicePermissions,
  listServiceRoles,
  registerPermissionCatalogue,
  setServiceRolesRemoved,
  updateServiceRole
} from "../services/service-roles.service";

/** The calling service has already decided the end user may do this; these handlers only
 * validate shape and store. `actor` and `reason` are recorded in the RBAC audit log. */

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];

const handle = (run: (req: Request) => Promise<unknown>, status = 200) =>
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(status).json(await run(req));
    } catch (error) {
      if (error instanceof ServiceRoleError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

const service = (req: Request) => String(req.params.service);

export const queryRoles = handle((req) =>
  listServiceRoles(service(req), {
    search: req.body?.search,
    filters: req.body?.filters,
    sortBy: req.body?.sortBy,
    sortDir: req.body?.sortDir === "DESC" ? "DESC" : "ASC",
    page: Number(req.body?.page) || 1,
    limit: Number(req.body?.limit) || 20,
    includeRemoved: Boolean(req.body?.includeRemoved),
    excludeIds: strings(req.body?.excludeIds)
  })
);

export const lookupRoles = handle(async (req) => ({
  roles: await getServiceRoles(
    service(req),
    strings(req.body?.ids),
    req.body?.includeRemoved !== false
  )
}));

export const createRole = handle(
  async (req) => ({
    role: await createServiceRole(
      service(req),
      req.body?.role ?? {},
      req.body?.actor,
      req.body?.reason
    )
  }),
  201
);

export const updateRole = handle(async (req) => ({
  role: await updateServiceRole(
    service(req),
    String(req.params.id),
    req.body?.role ?? {},
    req.body?.actor,
    req.body?.reason
  )
}));

export const removeRoles = handle(async (req) => ({
  count: await setServiceRolesRemoved(
    service(req),
    strings(req.body?.ids),
    true,
    req.body?.actor,
    req.body?.reason
  )
}));

export const restoreRoles = handle(async (req) => ({
  count: await setServiceRolesRemoved(
    service(req),
    strings(req.body?.ids),
    false,
    req.body?.actor,
    req.body?.reason
  )
}));

export const registerCatalogue = handle((req) =>
  registerPermissionCatalogue(
    service(req),
    Array.isArray(req.body?.permissions) ? req.body.permissions : []
  )
);

export const listPermissions = handle(async (req) => ({
  permissions: await listServicePermissions(service(req))
}));
