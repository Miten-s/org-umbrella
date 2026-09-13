import { Transaction } from "sequelize";
import CsvAuditLog, { CsvAuditAction } from "../models/csv-audit-log.model";

export interface AuditActor {
  id: string;
  fullName?: string;
}

export const writeAudit = async (params: {
  entityName: string;
  entityId: string;
  action: CsvAuditAction;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  actor: AuditActor;
  transaction?: Transaction;
}) => {
  const {
    entityName,
    entityId,
    action,
    oldValue,
    newValue,
    actor,
    transaction
  } = params;

  await CsvAuditLog.create(
    {
      entityName,
      entityId,
      action,
      oldData: oldValue ?? null,
      newData: newValue ?? null,
      userId: actor.id
    },
    { transaction }
  );
};
