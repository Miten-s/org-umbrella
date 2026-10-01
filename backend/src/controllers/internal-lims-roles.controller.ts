import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import {
  LimsRoleSyncBlocked,
  syncLimsRoles
} from "../services/lims-role-sync.service";

const isUuidLike = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);

/** lims-service's live mirror: it sends every Lab Role (with its entries) whenever one
 * changes, and backend converges on that set. All-or-nothing — a collision or unknown
 * permission answers 409 and changes nothing, so the LIMS-side edit can be rolled back. */
export const syncLimsRolesHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { roles, entries, actor, changeReason } = req.body ?? {};

    if (!Array.isArray(roles) || !Array.isArray(entries)) {
      res.status(400).json({ error: "roles and entries must be arrays" });
      return;
    }
    if (roles.some((r) => !isUuidLike(r?.id) || typeof r?.name !== "string")) {
      res.status(400).json({ error: "every role needs an id and a name" });
      return;
    }

    try {
      const result = await syncLimsRoles(
        {
          roles: roles.map((r) => ({
            id: r.id,
            roleCode: String(r.roleCode ?? ""),
            name: r.name,
            operateAll: !!r.operateAll,
            isDeleted: !!r.isDeleted,
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
            backendRoleId: r.backendRoleId ?? null
          })),
          entries: entries.map((e) => ({
            roleId: String(e.roleId),
            entry: String(e.entry),
            canView: !!e.canView,
            canCreate: !!e.canCreate,
            canEdit: !!e.canEdit,
            canRemove: !!e.canRemove
          }))
        },
        {
          actor: isUuidLike(actor?.id)
            ? { id: actor.id, email: actor.email }
            : undefined,
          reason: changeReason
            ? String(changeReason)
            : "Lab Role changed in LIMS"
        }
      );
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof LimsRoleSyncBlocked) {
        res
          .status(409)
          .json({ error: error.message, blockers: error.blockers });
        return;
      }
      throw error;
    }
  }
);
