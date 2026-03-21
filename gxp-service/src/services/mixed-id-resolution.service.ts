import mongoose from "mongoose";

export type ResolveIdsOptions = {
  model: mongoose.Model<any>;
  nameField: string;
  nameKeys: string[];
  createExtra?: Record<string, unknown>;
  queryExtra?: Record<string, unknown>;
  session?: mongoose.ClientSession;
};

/**
 * Converts mixed ID-like values into a valid Mongo ObjectId string when possible.
 * Supports plain strings and common object wrappers used by UI payloads.
 */
export const toObjectIdString = (raw: unknown): string | undefined => {
  if (!raw) return undefined;

  if (typeof raw === "string") {
    const value = raw.trim();
    return value && mongoose.isValidObjectId(value) ? value : undefined;
  }

  if (mongoose.isValidObjectId(raw as any)) {
    return String(raw);
  }

  if (typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    const nested = rec._id ?? rec.id ?? rec.value ?? rec.$oid;
    if (nested && mongoose.isValidObjectId(nested as any)) {
      return String(nested);
    }
  }

  return undefined;
};

/**
 * Resolves mixed arrays (IDs + names + objects) to de-duplicated document IDs.
 * - existing IDs are reused
 * - known names are mapped to existing IDs
 * - unknown names are created on the target model
 */
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
    const queryFilter = {
      ...(options.queryExtra ?? {}),
      [options.nameField]: { $in: cleanedNames }
    };

    let query = options.model.find(queryFilter);
    if (options.session) {
      query = query.session(options.session);
    }
    const existing = await query.lean();

    const existingNameSet = new Set(
      existing.map((doc: Record<string, any>) => doc[options.nameField])
    );
    ids.push(...existing.map((doc: Record<string, any>) => String(doc._id)));

    const toCreate = cleanedNames.filter((name) => !existingNameSet.has(name));
    if (toCreate.length) {
      const inserts = toCreate.map((name) => ({
        insertOne: {
          document: {
            [options.nameField]: name,
            ...(options.createExtra ?? {})
          }
        }
      }));

      const result = await options.model.bulkWrite(inserts, {
        session: options.session
      });

      ids.push(...Object.values(result?.insertedIds ?? {}).map(String));
    }
  }

  return Array.from(new Set(ids));
};
