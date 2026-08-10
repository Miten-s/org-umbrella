import * as repo from "../repo/gxp-service-environments.repo";
import { PaginationOptions } from "../utils/pagination.util";
import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import { sequelize } from "../configs/db.sequelize";
import { Op } from "sequelize";
import crypto from "crypto";

export const addNewEnvironment = async (data: any, user: any) => {
  const environmentToCreate = {
    ...data,
    createdOn: new Date(),
    createdBy: user,
    modifiedOn: new Date(),
    modifiedBy: null,
    isActive: true
  };

  return await repo.createEnvironment(environmentToCreate);
};


export const getAllEnvironments = async (options: PaginationOptions) => {
  return await repo.findAllEnvironments(options);
};

export const updateEnvironment = async (
  id: string,
  updatedData: any,
  user: any
) => {
  return await repo.updateEnvironment(id, {
    ...updatedData,
    modifiedOn: new Date(),
    modifiedBy: user
  });
};

export const disableEnvironment = async (id: string) => {
  return await repo.disableEnvironment(id);
};

export const restoreEnvironment = async (id: string) => {
  return await repo.enableEnvironment(id);
};

export const deleteEnvironment = async (id: string) => {
  return await repo.deleteEnvironment(id);
};

export const bulkDeleteEnvironments = async (ids: string[]) => {
  const t = await sequelize.transaction();
  try {
    await GxpServiceApplicationModel.update(
      { applicationEnvironmentId: null },
      { where: { applicationEnvironmentId: ids }, transaction: t }
    );

    await GxpServiceApplicationModel.sequelize!.query(
      `DELETE FROM environments WHERE id IN (:ids)`,
      { replacements: { ids }, transaction: t }
    );

    await t.commit();
    return { count: ids.length };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkDuplicateEnvironments = async (ids: string[], user: any) => {
  const t = await sequelize.transaction();
  try {
    const sourceEnvs = await repo.findEnvironmentsByIds(ids);
    if (!sourceEnvs || sourceEnvs.length === 0) {
      throw new Error("Environments not found");
    }

    const duplicatedEnvs = [];

    for (const sourceEnv of sourceEnvs) {
      let baseName = sourceEnv.environmentName;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexStr = `^${escapedBaseName}(?:-\\((\\d+)\\))?$`;

      const similarEnvsResult = await repo.findEnvironmentsByFilter({
        environmentName: { [Op.iRegexp]: regexStr }
      });

      let maxIndex = 0;
      similarEnvsResult.forEach((env: any) => {
        const match = env.environmentName.match(new RegExp(regexStr, 'i'));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const now = new Date();
      const toSave: any = {
        ...sourceEnv,
        id: crypto.randomUUID(),
        environmentName: newName,
        createdOn: now,
        createdBy: user,
        modifiedOn: now,
        modifiedBy: null,
        isActive: true
      };

      delete toSave._id;
      delete toSave.__v;
      delete toSave.createdAt;
      delete toSave.updatedAt;

      const newEnv = await repo.createEnvironment(toSave);
      duplicatedEnvs.push(newEnv);
    }

    await t.commit();
    return duplicatedEnvs;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
