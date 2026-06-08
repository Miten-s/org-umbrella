import { PaginationOptions } from "../utils/pagination.util";
import mongoose from "mongoose";
import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model";
import * as repo from "../repo/gxp-service-assignment-groups.repo";

export const addGroup = async (data: any) => {
  const newGroup = {
    ...data,
    createdOn: new Date(),
    modifiedOn: new Date(),
    isActive: true
  };

  return await repo.createGroup(newGroup);
};


export const getAll = async (options: PaginationOptions) => {
  return await repo.getAllGroups(options);
};
export const update = async (id: string, updateData: any) => {
  const { createdOn, createdBy, ...safeUpdateData } = updateData;

  return await repo.updateGroupById(id, {
    ...safeUpdateData,
    modifiedOn: new Date()
  });
};

export const disable = async (groupName: string) => {
  return await repo.disableGroup(groupName);
};

export const enable = async (groupName: string) => {
  return await repo.enableGroup(groupName);
};

export const search = async (term: string) => {
  return await repo.searchGroups(term);
};

export const deleteGroup = async (id: string) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await GxpServiceApplicationModel.updateMany(
      { assignmentGroup: id },
      { $unset: { assignmentGroup: "" } },
      { session }
    );
    await GxpServiceRequestModel.updateMany(
      { assignmentGroup: id },
      { $unset: { assignmentGroup: "" } },
      { session }
    );

    const deleted = await repo.deleteGroupById(id);

    await session.commitTransaction();
    return deleted;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const bulkDeleteGroups = async (ids: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await GxpServiceApplicationModel.updateMany(
      { assignmentGroup: { $in: ids } },
      { $unset: { assignmentGroup: "" } },
      { session }
    );
    await GxpServiceRequestModel.updateMany(
      { assignmentGroup: { $in: ids } },
      { $unset: { assignmentGroup: "" } },
      { session }
    );

    const deleted = await repo.bulkDeleteGroups(ids, session);

    await session.commitTransaction();
    return deleted;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const bulkDuplicateGroups = async (ids: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const sourceGroups = await repo.findGroupsByIds(ids);
    if (!sourceGroups || sourceGroups.length === 0) {
      throw new Error("Assignment groups not found");
    }

    const duplicatedGroups = [];

    for (const source of sourceGroups) {
      let baseName = source.groupName;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

      const similarResult = await repo.findGroupsByFilter({
        groupName: { $regex: regex }
      });

      let maxIndex = 0;
      similarResult.forEach((item: any) => {
        const match = item.groupName.match(regex);
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
        groupName: newName,
        createdOn: now,
        modifiedOn: now,
        isActive: true
      };

      delete toSave.__v;
      delete toSave.createdAt;
      delete toSave.updatedAt;

      const newGroup = await repo.createGroup(toSave);
      duplicatedGroups.push(newGroup);
    }

    await session.commitTransaction();
    return duplicatedGroups;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
