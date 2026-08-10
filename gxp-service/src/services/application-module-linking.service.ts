import AppModule from "../models/gxp-service-application-modules.model";
import Application from "../models/gxp-service-applications.model";
import { toObjectIdString } from "./mixed-id-resolution.service";
import { Op } from "sequelize";
import crypto from "crypto";

const normalizeModuleName = (value: string) => value.trim().toLowerCase();

const normalizeModuleIdSegment = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const buildModuleId = (moduleName: string, applicationName?: string) => {
  const left = normalizeModuleIdSegment(moduleName || "");
  const right = normalizeModuleIdSegment(applicationName || "unassigned");
  return `${left}_${right}`;
};

export const resolveModuleIdsForApplication = async (
  rawValues: unknown,
  applicationId: string,
  transaction?: any
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

      const moduleName = asRecord.moduleName ?? asRecord.name;
      if (typeof moduleName === "string" && moduleName.trim()) {
        names.push(moduleName.trim());
      }
    }
  }

  const uniqueIds = Array.from(new Set(ids));

  const selectedById = uniqueIds.length ? await AppModule.findAll({
    where: { id: uniqueIds },
    transaction
  }) : [];

  if (selectedById.length !== uniqueIds.length) {
    throw new Error("One or more selected modules do not exist");
  }

  const selectedByName = new Map<string, string>();
  for (const module of selectedById) {
    const key = normalizeModuleName(String(module.moduleName ?? ""));
    if (!key) continue;
    if (selectedByName.has(key)) {
      throw new Error(
        `Duplicate module name "${String(module.moduleName ?? "")}" for this application is not allowed`
      );
    }
    selectedByName.set(key, String(module.id ?? ""));
  }

  const requestedNames = Array.from(
    new Map(
      names
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => [normalizeModuleName(name), name])
    ).values()
  );

  const unresolvedNames: string[] = [];
  for (const name of requestedNames) {
    const key = normalizeModuleName(name);
    const selectedId = selectedByName.get(key);
    if (selectedId) {
      ids.push(selectedId);
    } else {
      unresolvedNames.push(name);
    }
  }

  if (unresolvedNames.length) {
    const existing = await AppModule.findAll({
      where: {
        applicationId,
        moduleName: { [Op.in]: unresolvedNames }
      },
      transaction
    });

    const existingByName = new Map<string, string>();
    for (const module of existing) {
      const key = normalizeModuleName(String(module.moduleName ?? ""));
      if (key && !existingByName.has(key)) {
        existingByName.set(key, String(module.id ?? ""));
      }
    }

    const appDoc = await Application.findByPk(applicationId, { transaction });
    const appName = appDoc?.applicationName || "unassigned";

    const toCreate: Array<{ id: string; moduleName: string; applicationId: string; moduleIdString: string; status: "enabled" | "disabled" }> = [];
    for (const name of unresolvedNames) {
      const key = normalizeModuleName(name);
      const existingId = existingByName.get(key);
      if (existingId) {
        ids.push(existingId);
      } else {
        toCreate.push({
          id: crypto.randomUUID(),
          moduleName: name,
          applicationId,
          moduleIdString: buildModuleId(name, appName),
          status: "enabled"
        });
      }
    }

    if (toCreate.length) {
      const created = await AppModule.bulkCreate(toCreate, { transaction });
      ids.push(...created.map((doc) => doc.id));
    }
  }

  const finalIds = Array.from(new Set(ids));
  const finalModules = finalIds.length ? await AppModule.findAll({
    where: { id: finalIds },
    transaction
  }) : [];

  const seen = new Set<string>();
  for (const module of finalModules) {
    const key = normalizeModuleName(String(module.moduleName ?? ""));
    if (!key) continue;
    if (seen.has(key)) {
      throw new Error(
        `Duplicate module name "${String(module.moduleName ?? "")}" for this application is not allowed`
      );
    }
    seen.add(key);
  }

  return finalIds;
};

export const syncModuleOwnership = async (
  applicationId: string,
  moduleIds: string[],
  previousModuleIds: string[] = [],
  transaction?: any
) => {
  await AppModule.update(
    { applicationId },
    { where: { id: moduleIds }, transaction }
  );

  const removedModuleIds = previousModuleIds.filter(
    (moduleId) => !moduleIds.includes(moduleId)
  );

  if (removedModuleIds.length) {
    await AppModule.destroy(
      { where: { id: removedModuleIds, applicationId }, transaction }
    );
  }
};
