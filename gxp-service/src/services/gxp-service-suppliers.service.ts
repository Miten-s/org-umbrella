import * as repo from "../repo/gxp-service-suppliers.repo";
import { IGxpSupplier } from "../models/gxp-service-suppliers.model";
import { PaginationOptions } from "../utils/pagination.util";
import mongoose from "mongoose";
import GxpServiceApplicationModel from "../models/gxp-service-applications.model";

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


export const listSuppliers = async (options: PaginationOptions, includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";
  return await repo.findAllSuppliers(filter, options);
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

export const bulkDeleteSuppliers = async (ids: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await GxpServiceApplicationModel.updateMany(
      { supplier: { $in: ids } },
      { $unset: { supplier: "" } },
      { session }
    );

    const deleted = await repo.bulkDeleteSuppliers(ids, session);

    await session.commitTransaction();
    return deleted;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const bulkDuplicateSuppliers = async (ids: string[], user: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const sourceSuppliers = await repo.findSuppliersByIds(ids);
    if (!sourceSuppliers || sourceSuppliers.length === 0) {
      throw new Error("Suppliers not found");
    }

    const duplicatedSuppliers = [];

    for (const source of sourceSuppliers) {
      let baseName = source.supplierName;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

      const similarResult = await repo.findSuppliersByFilter({
        supplierName: { $regex: regex }
      });

      let maxIndex = 0;
      similarResult.forEach((item: any) => {
        const match = item.supplierName.match(regex);
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const now = new Date();
      const toSave: any = {
        ...source,
        _id: new mongoose.Types.ObjectId(),
        supplierName: newName,
        createdOn: now,
        createdBy: user,
        modifiedOn: now,
        modifiedBy: null,
        status: source.status ?? "enabled"
      };

      delete toSave.__v;
      delete toSave.createdAt;
      delete toSave.updatedAt;

      const newSupplier = await repo.createSupplier(toSave);
      duplicatedSuppliers.push(newSupplier);
    }

    await session.commitTransaction();
    return duplicatedSuppliers;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
