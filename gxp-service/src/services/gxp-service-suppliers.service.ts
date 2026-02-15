import * as repo from "../repo/gxp-service-suppliers.repo";
import { IGxpSupplier } from "../models/gxp-service-suppliers.model";

export const createSupplier = async (
  payload: Partial<IGxpSupplier>,
  currentUser?: string
) => {
  const now = new Date();
  const toSave: Partial<IGxpSupplier> = {
    ...payload,
    createdOn: now,
    createdBy: currentUser ?? null,
    modifiedOn: now,
    modifiedBy: currentUser ?? null,
    status: payload.status ?? "enabled"
  };
  return await repo.createSupplier(toSave);
};

export const listSuppliers = async (includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";
  return await repo.findAllSuppliers(filter);
};

export const getSupplier = async (id: string) => {
  return await repo.findSupplierById(id);
};

export const updateSupplier = async (
  id: string,
  updates: Partial<IGxpSupplier>,
  currentUser?: string
) => {
  const modified = {
    ...updates,
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  };
  return await repo.updateSupplierById(id, modified);
};

export const disableSupplier = async (id: string, currentUser?: string) => {
  await repo.updateSupplierById(id, {
    status: "disabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  });
  return await repo.softDisableSupplier(id);
};

export const enableSupplier = async (id: string, currentUser?: string) => {
  await repo.updateSupplierById(id, {
    status: "enabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  });
  return await repo.restoreSupplier(id);
};

export const deleteSupplier = async (id: string) => {
  return await repo.deleteSupplierById(id);
};
