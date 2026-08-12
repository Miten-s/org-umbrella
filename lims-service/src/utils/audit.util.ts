import { Transaction } from "sequelize";
import AuditLog, { AuditAction } from "../models/audit-log.model";

export interface AuditActor {
  id: string;
  fullName?: string;
}

/** Writes one audit row. Called by the CRUD factory on every mutation. */
export const writeAudit = async (params: {
  entityName: string;
  entityId: string;
  action: AuditAction;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  /**
   * Per-collection added/removed/changed for nested sub-forms. `oldValue` and
   * `newValue` already carry the full child arrays — this is the readable
   * summary, so an audit screen can say "component pH changed 6.8 → 7.1"
   * without diffing two arrays by eye.
   */
  childChanges?: Record<string, any> | null;
  changeReason?: string | null;
  actor: AuditActor;
  transaction?: Transaction;
}) => {
  const {
    entityName,
    entityId,
    action,
    oldValue,
    newValue,
    childChanges,
    changeReason,
    actor,
    transaction
  } = params;

  await AuditLog.create(
    {
      entityName,
      entityId,
      action,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      childChanges: childChanges ?? null,
      changeReason: changeReason ?? null,
      performedBy: actor.id,
      performedByName: actor.fullName ?? null
    },
    { transaction }
  );
};
