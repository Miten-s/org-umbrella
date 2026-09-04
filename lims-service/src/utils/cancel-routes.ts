import { Router, Request, Response } from "express";
import { Model, ModelStatic } from "sequelize";
import asyncHandler from "../middlewares/error.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { writeAudit } from "../utils/audit.util";
import { formatLimsEntity } from "../utils/format.util";
import { auditNameFor } from "./entity-registry";

/** Cancel/Reactivate for Lab Execution entities, distinct from Remove/Restore — cancelling
 * records a real business outcome and stays visible; removing hides it. Requires a change reason. */
export const CANCELLABLE_STATUSES = ["Open", "Cancelled", "Complete"] as const;

export const attachCancelRoutes = <M extends Model>(
  router: Router,
  params: { model: ModelStatic<M>; permissionEntity: string; entityName: string }
): Router => {
  const { model, permissionEntity, entityName } = params;

  const transition = (target: "Cancelled" | "Open", action: "CANCEL" | "REACTIVATE") =>
    asyncHandler(async (req: Request, res: Response) => {
      const id = req.params["id"] as string;
      const scope = req.access!;

      const record = await model.findOne({ where: { id, isDeleted: false } as any });
      if (!record) return res.status(404).json({ message: `${entityName} not found.` });

      // Group check, same rule the CRUD factory applies to every read.
      const groupId = (record as Model & { groupId?: string | null }).get?.("groupId") as
        | string
        | null
        | undefined;
      if (!scope.operateAll && groupId && !scope.accessGroupIds.includes(groupId)) {
        return res.status(403).json({ message: `${entityName} is outside your groups.` });
      }

      const before = record.toJSON();

      await model.update(
        {
          status: target,
          cancelledAt: target === "Cancelled" ? new Date() : null,
          cancelledBy: target === "Cancelled" ? (req.user?.id ?? null) : null,
          modifiedBy: req.user?.id ?? null
        } as any,
        { where: { id } as any }
      );

      const after = await model.findByPk(id);

      await writeAudit({
        entityName: auditNameFor(permissionEntity),
        entityId: id,
        action,
        oldValue: before,
        newValue: after!.toJSON(),
        changeReason: (req.body as { changeReason?: string })?.changeReason ?? null,
        actor: { id: req.user?.id ?? "system", fullName: req.user?.fullName }
      });

      res.status(200).json({
        message: `${entityName} ${target === "Cancelled" ? "cancelled" : "reactivated"}`,
        data: formatLimsEntity(after)
      });
    });

  // UPDATE permission, not DELETE: cancelling is a state change on a record
  // that remains, not a removal.
  router.patch("/:id/cancel", authorize(permissionEntity, "UPDATE"), transition("Cancelled", "CANCEL"));
  router.patch("/:id/reactivate", authorize(permissionEntity, "UPDATE"), transition("Open", "REACTIVATE"));

  return router;
};

export default attachCancelRoutes;
