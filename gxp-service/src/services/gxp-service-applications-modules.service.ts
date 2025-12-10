import * as repo from "../repo/gxp-service-application-modules.repo";
import { IGxpServiceAppModule } from "../models/gxp-service-application-modules.model";

export const createApplicationModule = async (
  payload: Partial<IGxpServiceAppModule>,
  currentUser: string
) => {
  return await repo.createApplicationModule(payload, currentUser);
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
  return await repo.updateApplicationModule(id, updates);
};

export const deleteApplicationModule = async (id: string) => {
  return await repo.deleteApplcationModule(id);
};
