import * as repo from "../repo/gxp-service-suppliers.repo";
import { ISupplier } from "../models/gxp-service-suppliers.model";
import { PaginationOptions } from "../utils/pagination.util";
import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import { sequelize } from "../configs/db.sequelize";
import { Op } from "sequelize";
import crypto from "crypto";

export const createSupplier = async (
  payload: Partial<ISupplier>,
  currentUser?: string
) => {
  const now = new Date();
  const toSave: Partial<ISupplier> = {
    ...payload,
    createdOn: now,
    createdBy: currentUser || undefined,
    modifiedOn: now,
    modifiedBy: currentUser || undefined,
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
  updates: Partial<ISupplier>,
  currentUser?: string
) => {
  const modified = {
    ...updates,
    modifiedOn: new Date(),
    modifiedBy: currentUser || undefined
  };
  return await repo.updateSupplierById(id, modified);
};

export const disableSupplier = async (id: string, currentUser?: string) => {
  await repo.updateSupplierById(id, {
    status: "disabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser || undefined
  });
  return await repo.softDisableSupplier(id);
};

export const enableSupplier = async (id: string, currentUser?: string) => {
  await repo.updateSupplierById(id, {
    status: "enabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser || undefined
  });
  return await repo.restoreSupplier(id);
};

export const deleteSupplier = async (id: string) => {
  return await repo.deleteSupplierById(id);
};

export const bulkDeleteSuppliers = async (ids: string[]) => {
  const t = await sequelize.transaction();
  try {
    await GxpServiceApplicationModel.update(
      { supplierId: null },
      { where: { supplierId: ids }, transaction: t }
    );

    await GxpServiceApplicationModel.sequelize!.query(
      `DELETE FROM suppliers WHERE id IN (:ids)`,
      { replacements: { ids }, transaction: t }
    );

    await t.commit();
    return { count: ids.length };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkDuplicateSuppliers = async (ids: string[], user: any) => {
  const t = await sequelize.transaction();
  try {
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
      const regexStr = `^${escapedBaseName}(?:-\\((\\d+)\\))?$`;

      const similarResult = await repo.findSuppliersByFilter({
        supplierName: { [Op.iRegexp]: regexStr }
      });

      let maxIndex = 0;
      similarResult.forEach((item: any) => {
        const match = item.supplierName.match(new RegExp(regexStr, 'i'));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const now = new Date();
      const toSave: any = {
        ...source,
        id: crypto.randomUUID(),
        supplierName: newName,
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

      const newSupplier = await repo.createSupplier(toSave);
      duplicatedSuppliers.push(newSupplier);
    }

    await t.commit();
    return duplicatedSuppliers;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
