import * as repo from "../repo/gxp-service-applications.repo";
import { IApplication } from "../models/gxp-service-applications.model";

export const create = async (
  payload: Partial<IApplication>,
  currentUser?: string
) => {
  const now = new Date();
  const toSave: Partial<IApplication> = {
    ...payload,
    createdOn: now,
    createdBy: currentUser ?? null,
    modifiedOn: now,
    modifiedBy: currentUser ?? null,
    status: "enabled"
  };

  return await repo.create(toSave);
};

export const list = async (includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";
  return await repo.findAll(filter);
};

export const getById = async (id: string) => {
  return await repo.findById(id);
};

export const update = async (
  id: string,
  updates: Partial<IApplication>,
  currentUser?: string
) => {
  const modified = {
    ...updates,
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  };
  return await repo.updateById(id, modified);
};

export const remove = async (id: string, currentUser?: string) => {
  await repo.updateById(id, {
    status: "disabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  });
  return await repo.softDisable(id);
};

export const restore = async (id: string, currentUser?: string) => {
  await repo.updateById(id, {
    status: "enabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  });
  return await repo.restore(id);
};

export const deleteApplication = async (id: string) => {
  return await repo.deleteApplcation(id);
};
