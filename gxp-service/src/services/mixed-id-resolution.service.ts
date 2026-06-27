import { Op } from "sequelize";
import crypto from "crypto";

export type ResolveIdsOptions = {
  model: any;
  nameField: string;
  nameKeys: string[];
  createExtra?: Record<string, unknown>;
  queryExtra?: Record<string, unknown>;
  transaction?: any;
};

export const toObjectIdString = (raw: unknown): string | undefined => {
  if (!raw) return undefined;

  const checkAndConvert = (val: string): string | undefined => {
    const value = val.trim();
    if (value.length === 36) {
      return value;
    }
    // Check if it's a 24-character hexadecimal MongoDB ObjectId
    if (value.length === 24 && /^[0-9a-fA-F]{24}$/.test(value)) {
      const p1 = value.substring(0, 8);
      const p2 = value.substring(8, 12);
      const p3 = value.substring(12, 16);
      const p4 = value.substring(16, 20);
      const p5 = value.substring(20, 24);
      return `${p1}-${p2}-${p3}-${p4}-${p5}00000000`;
    }
    return undefined;
  };

  if (typeof raw === "string") {
    return checkAndConvert(raw);
  }

  if (typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    const nested = rec._id ?? rec.id ?? rec.value ?? rec.$oid;
    if (nested && typeof nested === "string") {
      return checkAndConvert(nested);
    }
  }

  return undefined;
};

export const resolveIds = async (
  rawValues: unknown,
  options: ResolveIdsOptions
): Promise<string[] | undefined> => {
  if (!Array.isArray(rawValues)) return undefined;

  const ids: string[] = [];
  const names: string[] = [];

  for (const item of rawValues) {
    if (!item) continue;

    if (typeof item === "string") {
      const value = item.trim();
      if (!value) continue;

      const objectId = toObjectIdString(value);
      if (objectId) {
        ids.push(objectId);
      } else {
        names.push(value);
      }
      continue;
    }

    if (typeof item === "object") {
      const asRecord = item as Record<string, unknown>;
      const objectId = toObjectIdString(
        asRecord._id ?? asRecord.id ?? asRecord.value ?? asRecord.$oid ?? item
      );
      if (objectId) {
        ids.push(objectId);
        continue;
      }

      for (const key of options.nameKeys) {
        const val = asRecord[key];
        if (typeof val === "string" && val.trim()) {
          names.push(val.trim());
          break;
        }
      }
    }
  }

  const cleanedNames = Array.from(new Set(names.filter(Boolean)));
  if (cleanedNames.length) {
    const where = {
      ...(options.queryExtra ?? {}),
      [options.nameField]: { [Op.in]: cleanedNames }
    };

    const existing = await options.model.findAll({
      where,
      transaction: options.transaction
    });

    const existingNameSet = new Set(
      existing.map((doc: any) => doc[options.nameField])
    );
    ids.push(...existing.map((doc: any) => String(doc.id)));

    const toCreate = cleanedNames.filter((name: string) => !existingNameSet.has(name));
    if (toCreate.length) {
      const recordsToCreate = toCreate.map((name: string) => ({
        id: crypto.randomUUID(),
        [options.nameField]: name,
        ...(options.createExtra ?? {})
      }));

      const created = await options.model.bulkCreate(recordsToCreate, {
        transaction: options.transaction
      });

      ids.push(...created.map((doc: any) => String(doc.id)));
    }
  }

  return Array.from(new Set(ids));
};
