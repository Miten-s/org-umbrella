import mongoose from "mongoose";
import { GxpServiceAppModuleModel } from "../models/gxp-service-application-modules.model";
import { toObjectIdString } from "./mixed-id-resolution.service";

/**
 * Keep regex-based exact-name lookups safe when matching user-entered module names.
 */
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Normalize module labels so duplicate checks are case/space insensitive.
 */
const normalizeModuleName = (value: string) => value.trim().toLowerCase();

/**
 * Resolve mixed module inputs (IDs + typed names) into module IDs for one application.
 * Why this exists:
 * - frontend can send existing IDs or typed names from Add button.
 * - typed names should create/reuse modules for the current application only.
 * - same-name modules must not be duplicated inside one application.
 * - modules linked to another application must not be reattached silently.
 */
export const resolveModuleIdsForApplication = async (
  rawValues: unknown,
  applicationId: string,
  session?: mongoose.ClientSession
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

  let selectedByIdQuery = GxpServiceAppModuleModel.find({
    _id: { $in: uniqueIds }
  });
  if (session) selectedByIdQuery = selectedByIdQuery.session(session);
  const selectedById = uniqueIds.length ? await selectedByIdQuery.lean() : [];

  if (selectedById.length !== uniqueIds.length) {
    throw new Error("One or more selected modules do not exist");
  }

  const selectedByName = new Map<string, string>();
  for (const module of selectedById as Array<Record<string, unknown>>) {
    const moduleApp = String(module?.application ?? "").trim();
    if (moduleApp && moduleApp !== applicationId) {
      throw new Error(
        `Module "${String(module?.moduleName ?? "")}" is already attached to another application`
      );
    }

    const key = normalizeModuleName(String(module?.moduleName ?? ""));
    if (!key) continue;
    if (selectedByName.has(key)) {
      throw new Error(
        `Duplicate module name "${String(module?.moduleName ?? "")}" for this application is not allowed`
      );
    }
    selectedByName.set(key, String(module?._id ?? ""));
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
    const nameFilters = unresolvedNames.map((name) => ({
      moduleName: new RegExp(`^${escapeRegExp(name)}$`, "i")
    }));

    let existingQuery = GxpServiceAppModuleModel.find({
      application: applicationId,
      $or: nameFilters
    });
    if (session) existingQuery = existingQuery.session(session);
    const existing = await existingQuery.lean();

    const existingByName = new Map<string, string>();
    for (const module of existing as Array<Record<string, unknown>>) {
      const key = normalizeModuleName(String(module?.moduleName ?? ""));
      if (key && !existingByName.has(key)) {
        existingByName.set(key, String(module?._id ?? ""));
      }
    }

    const toCreate: Array<{ moduleName: string; application: string }> = [];
    for (const name of unresolvedNames) {
      const key = normalizeModuleName(name);
      const existingId = existingByName.get(key);
      if (existingId) {
        ids.push(existingId);
      } else {
        toCreate.push({ moduleName: name, application: applicationId });
      }
    }

    if (toCreate.length) {
      const created = await GxpServiceAppModuleModel.create(toCreate, { session });
      ids.push(...created.map((doc) => doc._id.toString()));
    }
  }

  const finalIds = Array.from(new Set(ids));
  let finalQuery = GxpServiceAppModuleModel.find({ _id: { $in: finalIds } });
  if (session) finalQuery = finalQuery.session(session);
  const finalModules = finalIds.length ? await finalQuery.lean() : [];

  const seen = new Set<string>();
  for (const module of finalModules as Array<Record<string, unknown>>) {
    const key = normalizeModuleName(String(module?.moduleName ?? ""));
    if (!key) continue;
    if (seen.has(key)) {
      throw new Error(
        `Duplicate module name "${String(module?.moduleName ?? "")}" for this application is not allowed`
      );
    }
    seen.add(key);
  }

  return finalIds;
};

/**
 * Keep module.application in sync with application.applicationModules.
 * Why this exists:
 * - relationship is stored on both sides for fast filtering.
 * - create/update flows should not forget unlinking removed modules.
 */
export const syncModuleOwnership = async (
  applicationId: string,
  moduleIds: string[],
  previousModuleIds: string[] = [],
  session?: mongoose.ClientSession
) => {
  await GxpServiceAppModuleModel.updateMany(
    { _id: { $in: moduleIds } },
    { $set: { application: applicationId } },
    session ? { session } : undefined
  );

  const removedModuleIds = previousModuleIds.filter(
    (moduleId) => !moduleIds.includes(moduleId)
  );

  if (removedModuleIds.length) {
    await GxpServiceAppModuleModel.updateMany(
      { _id: { $in: removedModuleIds }, application: applicationId },
      { $unset: { application: 1 } },
      session ? { session } : undefined
    );
  }
};
