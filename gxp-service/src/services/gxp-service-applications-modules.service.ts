import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import { IGxpServiceAppModule } from "../models/gxp-service-application-modules.model";
import * as repo from "../repo/gxp-service-application-modules.repo";
import { toObjectIdString } from "./mixed-id-resolution.service";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeModuleIdSegment = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

// Intentionally uses application NAME (not ID)
const buildModuleId = (moduleName: string, applicationName?: string) => {
  const left = normalizeModuleIdSegment(moduleName || "");
  const right = normalizeModuleIdSegment(applicationName || "unassigned");
  return `${left}_${right}`;
};

const unassignedApplicationFilter = {
  $or: [
    { application: { $exists: false } },
    { application: null },
    { application: "" }
  ]
};

const parseApplicationId = (value: unknown): string | undefined => {
  if (!value) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const id = toObjectIdString(record._id ?? record.id ?? value);
    return id;
  }

  return undefined;
};

const parseApplicationName = (value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const candidate = (value as Record<string, unknown>).applicationName;
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : undefined;
};

const resolveApplicationName = async (
  applicationId?: string,
  fallbackName?: string
): Promise<string | undefined> => {
  if (fallbackName?.trim()) return fallbackName.trim();
  if (!applicationId) return undefined;

  const app = await GxpServiceApplicationModel.findById(applicationId)
    .select("applicationName")
    .lean();

  const name = (app as any)?.applicationName;
  return typeof name === "string" && name.trim() ? name.trim() : undefined;
};

const syncApplicationModulesFromModuleChange = async (
  moduleMongoId: string,
  previousApplicationId?: string,
  nextApplicationId?: string
) => {
  if (previousApplicationId && previousApplicationId !== nextApplicationId) {
    await GxpServiceApplicationModel.updateOne(
      { _id: previousApplicationId },
      { $pull: { applicationModules: moduleMongoId } }
    );
  }

  if (nextApplicationId) {
    await GxpServiceApplicationModel.updateOne(
      { _id: nextApplicationId },
      { $addToSet: { applicationModules: moduleMongoId } }
    );
  }
};

const findDuplicateForApplication = async (
  moduleName: string,
  applicationId: string | undefined,
  moduleId: string,
  excludeId?: string
) => {
  const fallbackFilter: Record<string, unknown> = {
    moduleName: new RegExp(`^${escapeRegExp(moduleName)}$`, "i")
  };

  if (applicationId) {
    fallbackFilter.application = applicationId;
  } else {
    fallbackFilter.$or = (unassignedApplicationFilter as any).$or;
  }

  const matches = await repo.getApplicationModules({
    $or: [{ moduleId }, fallbackFilter]
  });

  return matches.find((item: any) => String(item?._id) !== String(excludeId ?? ""));
};

const toPlain = (value: any) =>
  value && typeof value.toObject === "function" ? value.toObject() : value;

const stripLegacyUniqueName = (value: any) => {
  const plain = toPlain(value);
  if (plain && typeof plain === "object") {
    delete plain.uniqueName;
  }
  return plain;
};

export const createApplicationModule = async (
  payload: Partial<IGxpServiceAppModule>,
  currentUser: string
) => {
  const moduleName = (payload.moduleName ?? "").trim();
  const application = parseApplicationId(payload.application);
  const applicationName = await resolveApplicationName(application);

  if (application && !applicationName) {
    throw new Error("Application name not found for selected application");
  }

  const moduleId = buildModuleId(moduleName, applicationName);

  const existing = await findDuplicateForApplication(
    moduleName,
    application,
    moduleId
  );
  if (existing) {
    throw new Error(
      application
        ? "Module with the same name already exists for this application"
        : "Module with the same name already exists without application"
    );
  }

  const created = await repo.createApplicationModule(
    { ...payload, moduleName, application, moduleId },
    currentUser
  );

  const moduleMongoId = String((created as any)?._id ?? "");
  if (moduleMongoId && application) {
    await syncApplicationModulesFromModuleChange(moduleMongoId, undefined, application);
  }

  return stripLegacyUniqueName(created);
};

export const getApplicationModules = async (includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";

  const items = await repo.getApplicationModules(filter);
  return (items || []).map((item: any) => stripLegacyUniqueName(item));
};

export const getApplicationModuleById = async (id: string) => {
  const item = await repo.findApplicationModulesById(id);
  if (!item) return item;
  return stripLegacyUniqueName(item);
};

export const updateApplicationModule = async (
  id: string,
  updates: Partial<IGxpServiceAppModule>
) => {
  const existing = await repo.findApplicationModulesById(id);
  if (!existing) {
    throw new Error("Application module not found");
  }

  const previousApplicationId = parseApplicationId((existing as any).application);
  const previousApplicationName = parseApplicationName((existing as any).application);

  const moduleName =
    updates.moduleName !== undefined
      ? updates.moduleName.trim()
      : String((existing as any).moduleName ?? "").trim();

  const application =
    updates.application !== undefined
      ? parseApplicationId(updates.application)
      : previousApplicationId;

  const applicationName = await resolveApplicationName(application, previousApplicationName);

  if (application && !applicationName) {
    throw new Error("Application name not found for selected application");
  }

  const moduleId = buildModuleId(moduleName, applicationName);

  const isDuplicate = await findDuplicateForApplication(
    moduleName,
    application,
    moduleId,
    id
  );
  if (isDuplicate) {
    throw new Error(
      application
        ? "Module with the same name already exists for this application"
        : "Module with the same name already exists without application"
    );
  }

  const updated = await repo.updateApplicationModule(id, {
    ...updates,
    moduleName,
    application,
    moduleId
  });

  if (updated) {
    await syncApplicationModulesFromModuleChange(id, previousApplicationId, application);
  }

  return stripLegacyUniqueName(updated);
};

export const deleteApplicationModule = async (id: string) => {
  const existing = await repo.findApplicationModulesById(id);
  if (existing) {
    const applicationId = parseApplicationId((existing as any).application);
    if (applicationId) {
      await GxpServiceApplicationModel.updateOne(
        { _id: applicationId },
        { $pull: { applicationModules: id } }
      );
    }
  }

  return await repo.deleteApplcationModule(id);
};
