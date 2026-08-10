import { Model, ModelStatic } from "sequelize";
import { createAuditLog } from "../services/audit.service";

interface BulkDeleteOptions {
  Model: ModelStatic<any>;
  ids: string[];
  entityName: string;
  deletedBy: string;
  deletedByName: string;
  changeReason?: string;
}

interface BulkDuplicateOptions {
  Model: ModelStatic<any>;
  ids: string[];
  labelField: string;
  entityName: string;
  createdBy: string;
  createdByName: string;
}

/**
 * Soft-deletes multiple records and writes one audit row per record.
 * Returns the count of successfully deleted records.
 */
export const bulkSoftDelete = async (opts: BulkDeleteOptions): Promise<number> => {
  const { Model, ids, entityName, deletedBy, deletedByName, changeReason } = opts;
  let count = 0;

  for (const id of ids) {
    const record = await Model.findOne({ where: { id, isDeleted: false } });
    if (!record) continue;

    await Model.update(
      { isDeleted: true, deletedBy, deletedAt: new Date() },
      { where: { id } }
    );

    await createAuditLog({
      entityName,
      entityId: id,
      action: "DELETE",
      oldValue: record.toJSON(),
      newValue: null,
      changeReason: changeReason ?? undefined,
      performedBy: deletedBy,
      performedByName: deletedByName
    });

    count++;
  }

  return count;
};

/**
 * Duplicates multiple records, appending "-(N)" suffix to the label field.
 * Returns the count of successfully duplicated records.
 */
export const bulkDuplicate = async (opts: BulkDuplicateOptions): Promise<number> => {
  const { Model, ids, labelField, entityName, createdBy, createdByName } = opts;
  let count = 0;

  for (const id of ids) {
    const record = await Model.findOne({ where: { id, isRemoved: false } });
    if (!record) continue;

    const raw = record.toJSON();
    const base = String(raw[labelField] ?? "").replace(/-\(\d+\)$/, "");

    // Find unique suffix
    let index = 1;
    while (true) {
      const candidate = `${base}-(${index})`;
      const existing = await Model.findOne({ where: { [labelField]: candidate, isDeleted: false } });
      if (!existing) {
        raw[labelField] = candidate;
        break;
      }
      index++;
    }

    // Strip PK and timestamps so Sequelize creates a fresh row
    delete raw.id;
    delete raw.createdAt;
    delete raw.updatedAt;
    delete raw.deletedAt;
    raw.isDeleted = false;
    raw.deletedBy = null;

    const clone = await Model.create(raw);

    await createAuditLog({
      entityName,
      entityId: clone.id,
      action: "CREATE",
      oldValue: null,
      newValue: clone.toJSON(),
      changeReason: "Duplicated from " + id,
      performedBy: createdBy,
      performedByName: createdByName
    });

    count++;
  }

  return count;
};
