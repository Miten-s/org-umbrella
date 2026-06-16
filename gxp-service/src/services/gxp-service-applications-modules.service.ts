import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import { IAppModule } from "../models/gxp-service-application-modules.model";
import * as repo from "../repo/gxp-service-application-modules.repo";
import { toObjectIdString } from "./mixed-id-resolution.service";
import { PaginationOptions } from "../utils/pagination.util";
import { sequelize } from "../configs/db.sequelize";
import { Op } from "sequelize";
import crypto from "crypto";

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

  const app = await GxpServiceApplicationModel.findByPk(applicationId, {
    attributes: ["applicationName"]
  });

  const name = app?.applicationName;
  return typeof name === "string" && name.trim() ? name.trim() : undefined;
};

const findDuplicateForApplication = async (
  moduleName: string,
  applicationId: string | undefined,
  moduleId: string,
  excludeId?: string
) => {
  const filter: any = {
    moduleName: { [Op.iLike]: moduleName }
  };

  if (applicationId) {
    filter.applicationId = applicationId;
  } else {
    filter.applicationId = null;
  }

  const matchesResult = await repo.getApplicationModules(filter);
  const matches = Array.isArray(matchesResult) ? matchesResult : matchesResult.data;

  return matches.find((item: any) => String(item?.id) !== String(excludeId ?? ""));
};

const stripLegacyUniqueName = (value: any) => {
  if (value && typeof value === "object") {
    const json = value.toJSON ? value.toJSON() : { ...value };
    delete json.uniqueName;
    return json;
  }
  return value;
};

export const createApplicationModule = async (
  payload: Partial<IAppModule>,
  currentUser: string
) => {
  console.log("Creating application module with payload:", payload);
  const moduleName = (payload.moduleName ?? "").trim();
  const application = parseApplicationId(payload.applicationId || (payload as any).application);
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
    { ...payload, moduleName, applicationId: application, moduleIdString: moduleId },
    currentUser
  );

  return stripLegacyUniqueName(created);
};


export const getApplicationModules = async (options: PaginationOptions, includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";

  const result = await repo.getApplicationModules(filter, options);
  if (result && (result as any).data && Array.isArray((result as any).data)) {
    (result as any).data = (result as any).data.map((item: any) => stripLegacyUniqueName(item));
    return result;
  }
  return result;
};

export const getApplicationModuleById = async (id: string) => {
  const item = await repo.findApplicationModulesById(id);
  if (!item) return item;
  return stripLegacyUniqueName(item);
};

export const updateApplicationModule = async (
  id: string,
  updates: Partial<IAppModule>
) => {
  const existing = await repo.findApplicationModulesById(id);
  if (!existing) {
    throw new Error("Application module not found");
  }

  const previousApplicationId = parseApplicationId((existing as any).applicationId || (existing as any).application);
  const previousApplicationName = parseApplicationName((existing as any).application);

  const moduleName =
    updates.moduleName !== undefined
      ? updates.moduleName.trim()
      : String((existing as any).moduleName ?? "").trim();

  const application =
    (updates as any).applicationId !== undefined
      ? parseApplicationId((updates as any).applicationId)
      : (updates.applicationId !== undefined ? parseApplicationId(updates.applicationId) : previousApplicationId);

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
    applicationId: application,
    moduleIdString: moduleId
  });

  return stripLegacyUniqueName(updated);
};

export const deleteApplicationModule = async (id: string) => {
  return await repo.deleteApplcationModule(id);
};

export const bulkDeleteApplicationModules = async (ids: string[]) => {
  return await repo.bulkDeleteApplicationModules(ids);
};

export const bulkDuplicateApplicationModules = async (ids: string[], user: any) => {
  const t = await sequelize.transaction();
  try {
    const sourceModules = await repo.findApplicationModulesByIds(ids);
    if (!sourceModules || sourceModules.length === 0) {
      throw new Error("Application modules not found");
    }

    const duplicatedModules = [];

    for (const source of sourceModules) {
      let baseName = source.moduleName;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexStr = `^${escapedBaseName}(?:-\\((\\d+)\\))?$`;

      const similarResult = await repo.findApplicationModulesByFilter({
        moduleName: { [Op.iRegexp]: regexStr }
      });

      let maxIndex = 0;
      similarResult.forEach((item: any) => {
        const match = item.moduleName.match(new RegExp(regexStr, 'i'));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;
      const applicationName = await resolveApplicationName(source.applicationId);
      const newModuleId = buildModuleId(newName, applicationName);

      const now = new Date();
      const toSave: any = {
        ...source,
        id: crypto.randomUUID(),
        moduleName: newName,
        moduleIdString: newModuleId,
        createdOn: now,
        createdBy: user,
        modifiedOn: now,
        modifiedBy: null,
        status: source.status ?? "enabled"
      };

      delete toSave._id;
      delete toSave.__v;
      delete toSave.createdAt;
      delete toSave.updatedAt;

      const newModule = await repo.createApplicationModule(toSave, user);
      duplicatedModules.push(newModule);
    }

    await t.commit();
    return duplicatedModules.map(stripLegacyUniqueName);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
