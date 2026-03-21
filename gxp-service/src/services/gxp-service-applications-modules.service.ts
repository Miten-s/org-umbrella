import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import * as repo from "../repo/gxp-service-application-modules.repo";
import { IGxpServiceAppModule } from "../models/gxp-service-application-modules.model";
import { toObjectIdString } from "./mixed-id-resolution.service";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const syncApplicationModulesFromModuleChange = async (
  moduleId: string,
  previousApplicationId?: string,
  nextApplicationId?: string
) => {
  if (previousApplicationId && previousApplicationId !== nextApplicationId) {
    await GxpServiceApplicationModel.updateOne(
      { _id: previousApplicationId },
      { $pull: { applicationModules: moduleId } }
    );
  }

  if (nextApplicationId) {
    await GxpServiceApplicationModel.updateOne(
      { _id: nextApplicationId },
      { $addToSet: { applicationModules: moduleId } }
    );
  }
};

const findDuplicateForApplication = async (
  moduleName: string,
  application?: string,
  excludeId?: string
) => {
  const filter: Record<string, unknown> = {
    moduleName: new RegExp(`^${escapeRegExp(moduleName)}$`, "i")
  };

  if (application) {
    filter.application = application;
  } else {
    filter.$or = (unassignedApplicationFilter as any).$or;
  }

  const matches = await repo.getApplicationModules(filter);
  return matches.find((item: any) => String(item?._id) !== String(excludeId ?? ""));
};

export const createApplicationModule = async (
  payload: Partial<IGxpServiceAppModule>,
  currentUser: string
) => {
  const moduleName = (payload.moduleName ?? "").trim();
  const applicationValue = (payload.application ?? "").trim();
  const application = applicationValue || undefined;

  const existing = await findDuplicateForApplication(moduleName, application);
  if (existing) {
    throw new Error(
      application
        ? "Module with the same name already exists for this application"
        : "Module with the same name already exists without application"
    );
  }

  const created = await repo.createApplicationModule(
    { ...payload, moduleName, application },
    currentUser
  );

  const moduleId = String((created as any)?._id ?? "");
  if (moduleId && application) {
    await syncApplicationModulesFromModuleChange(moduleId, undefined, application);
  }

  return created;
};

export const getApplicationModules = async (includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter["status"] = "enabled";
  return await repo.getApplicationModules(filter);
};

export const getApplicationModuleById = async (id: string) => {
  return await repo.findApplicationModulesById(id);
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

  const moduleName =
    updates.moduleName !== undefined
      ? updates.moduleName.trim()
      : String((existing as any).moduleName ?? "").trim();

  const applicationValue =
    updates.application !== undefined
      ? updates.application.trim()
      : String(previousApplicationId ?? "").trim();
  const application = applicationValue || undefined;

  const isDuplicate = await findDuplicateForApplication(moduleName, application, id);
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
    application
  });

  if (updated) {
    await syncApplicationModulesFromModuleChange(id, previousApplicationId, application);
  }

  return updated;
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
