import * as repo from "../repo/gxp-service-environments.repo";
import { PaginationOptions } from "../utils/pagination.util";
import mongoose from "mongoose";
import GxpServiceApplicationModel from "../models/gxp-service-applications.model";

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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await GxpServiceApplicationModel.updateMany(
      { applicationEnvironment: { $in: ids } },
      { $unset: { applicationEnvironment: "" } },
      { session }
    );

    const deleted = await repo.bulkDeleteEnvironments(ids, session);

    await session.commitTransaction();
    return deleted;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const bulkDuplicateEnvironments = async (ids: string[], user: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

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
      const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

      const similarEnvsResult = await repo.findEnvironmentsByFilter({
        environmentName: { $regex: regex }
      });

      let maxIndex = 0;
      similarEnvsResult.forEach((env: any) => {
        const match = env.environmentName.match(regex);
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const now = new Date();
      const toSave: any = {
        ...sourceEnv,
        _id: new mongoose.Types.ObjectId(),
        environmentName: newName,
        createdOn: now,
        createdBy: user,
        modifiedOn: now,
        modifiedBy: null,
        isActive: true
      };

      delete toSave.__v;
      delete toSave.createdAt;
      delete toSave.updatedAt;

      const newEnv = await repo.createEnvironment(toSave);
      duplicatedEnvs.push(newEnv);
    }

    await session.commitTransaction();
    return duplicatedEnvs;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
