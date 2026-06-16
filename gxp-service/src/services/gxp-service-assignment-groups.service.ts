import { PaginationOptions } from "../utils/pagination.util";
import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import ServiceRequest from "../models/gxp-service-service-requests.model";
import * as repo from "../repo/gxp-service-assignment-groups.repo";
import { sequelize } from "../configs/db.sequelize";
import { Op } from "sequelize";
import crypto from "crypto";

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
  const t = await sequelize.transaction();
  try {
    await GxpServiceApplicationModel.update(
      { assignmentGroupId: null },
      { where: { assignmentGroupId: id }, transaction: t }
    );
    await ServiceRequest.update(
      { assignmentGroupId: null },
      { where: { assignmentGroupId: id }, transaction: t }
    );

    const deleted = await repo.deleteGroupById(id);

    await t.commit();
    return deleted;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkDeleteGroups = async (ids: string[]) => {
  const t = await sequelize.transaction();
  try {
    await GxpServiceApplicationModel.update(
      { assignmentGroupId: null },
      { where: { assignmentGroupId: ids }, transaction: t }
    );
    await ServiceRequest.update(
      { assignmentGroupId: null },
      { where: { assignmentGroupId: ids }, transaction: t }
    );

    const deleted = await repo.bulkDeleteGroups(ids);

    await t.commit();
    return deleted;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkDuplicateGroups = async (ids: string[]) => {
  const t = await sequelize.transaction();
  try {
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
      const regexStr = `^${escapedBaseName}(?:-\\((\\d+)\\))?$`;

      const similarResult = await repo.findGroupsByFilter({
        groupName: { [Op.iRegexp]: regexStr }
      });

      let maxIndex = 0;
      similarResult.forEach((item: any) => {
        const match = item.groupName.match(new RegExp(regexStr, 'i'));
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
        groupName: newName,
        createdOn: now,
        modifiedOn: now,
        isActive: true
      };

      delete toSave._id;
      delete toSave.__v;
      delete toSave.createdAt;
      delete toSave.updatedAt;

      const newGroup = await repo.createGroup(toSave);
      duplicatedGroups.push(newGroup);
    }

    await t.commit();
    return duplicatedGroups;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
