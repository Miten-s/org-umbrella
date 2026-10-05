import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { User } from "../models/user.model";
import { Role } from "../models/role.model";
import { Permission } from "../models/permission.model";

/** Raw permission names granted to a platform user via their assigned roles — no scoping,
 * no service-specific logic. Callers (lims-service, gxp-service) apply their own scoping
 * (e.g. LIMS groups) on top of this. */
export const getPermissionsForUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["id"],
          include: [
            { model: Permission, as: "permissions", attributes: ["name"] }
          ]
        }
      ]
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const permissions = new Set<string>();
    for (const role of (user as unknown as { roles?: Role[] }).roles ?? []) {
      for (const permission of role.permissions ?? []) {
        permissions.add(permission.name);
      }
    }

    res.status(200).json({ userId, permissions: [...permissions] });
  }
);

/** Union of permission names granted by an arbitrary set of role ids — used where a
 * service tracks its own role assignment locally (e.g. gxp_users.roles) rather than
 * relying on the platform's own user_roles assignment. */
export const getPermissionsForRoles = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const raw = req.query.roleIds;
    const roleIds =
      typeof raw === "string" ? raw.split(",").filter(Boolean) : [];

    if (roleIds.length === 0) {
      res.status(200).json({ permissions: [] });
      return;
    }

    const roles = await Role.findAll({
      where: { id: roleIds },
      attributes: ["id"],
      include: [{ model: Permission, as: "permissions", attributes: ["name"] }]
    });

    const permissions = new Set<string>();
    for (const role of roles) {
      for (const permission of role.permissions ?? []) {
        permissions.add(permission.name);
      }
    }

    res.status(200).json({ permissions: [...permissions] });
  }
);
