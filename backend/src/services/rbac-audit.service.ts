import { Transaction } from "sequelize";
import RbacAuditLog, {
  RbacAuditAction,
  RbacAuditTargetType
} from "../models/rbac-audit-log.model";
import { IUser } from "../models/user.model";

interface RbacChangeEntry {
  actor?: IUser;
  action: RbacAuditAction;
  targetType: RbacAuditTargetType;
  targetId?: string | null;
  targetName?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
}

/** Writes one audit row. Deliberately NOT best-effort: pass the mutation's own transaction
 * and a failure here rolls the mutation back with it. In a regulated system an unlogged
 * privilege change is worse than a failed one, so this is the opposite of how the
 * invalidation publisher behaves. */
export const recordRbacChange = async (
  entry: RbacChangeEntry,
  transaction?: Transaction
): Promise<void> => {
  const { actor, ...rest } = entry;

  await RbacAuditLog.create(
    {
      ...rest,
      actorUserId: actor?.id ?? null,
      actorEmail: actor?.email ?? null
    },
    { transaction }
  );
};

/** Role permissions arrive as ids in some paths and hydrated objects in others; store a
 * stable, comparable shape either way. */
export const permissionNamesOf = (
  permissions?: Array<string | { name?: string; id?: string }> | null
): string[] =>
  (permissions ?? []).map((p) =>
    typeof p === "string" ? p : (p.name ?? p.id ?? "")
  );
