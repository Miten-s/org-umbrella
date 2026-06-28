import GxpServiceAssignmentGroupModel, { AssignmentGroupMember } from "../models/gxp-service-assignment-groups.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import crypto from "crypto";
import { sequelize } from "../configs/db.sequelize";

const formatGroup = (group: any) => {
  if (!group) return null;
  const json = group.toJSON ? group.toJSON() : { ...group };
  json._id = json.id;

  // Reconstruct manager
  json.manager = {
    userId: json.managerUserId,
    name: json.managerName
  };

  // Reconstruct members
  if (json.members) {
    json.members = json.members.map((m: any) => ({
      userId: m.id,
      name: m.AssignmentGroupMember?.userName || m.userName || m.name
    }));
  } else {
    json.members = [];
  }

  return json;
};

export const findGroupById = async (id: string) => {
  const doc = await GxpServiceAssignmentGroupModel.findByPk(id, {
    include: [
      {
        association: "members",
        through: { attributes: ["userName"] }
      }
    ]
  });
  return formatGroup(doc);
};

export const createGroup = async (data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const payload = {
      id: data.id || crypto.randomUUID(),
      groupName: data.groupName,
      managerUserId: data.manager?.userId,
      managerName: data.manager?.name,
      description: data.description,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: data.createdBy,
      createdOn: data.createdOn || new Date(),
      modifiedOn: data.modifiedOn || new Date(),
      modifiedBy: data.modifiedBy
    };

    const doc = await GxpServiceAssignmentGroupModel.create(payload, { transaction });
    
    // Create members
    if (data.members && Array.isArray(data.members)) {
      const memberRecords = data.members.map((member: any) => ({
        groupId: doc.id,
        userId: member.userId,
        userName: member.name
      }));
      await AssignmentGroupMember.bulkCreate(memberRecords, { transaction });
    }

    await transaction.commit();

    return await findGroupById(doc.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getAllGroups = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const where: any = {};
  if (search) {
    const sanitizedSearch = `%${search}%`;
    where[Op.or] = [
      { groupName: { [Op.iLike]: sanitizedSearch } },
      { description: { [Op.iLike]: sanitizedSearch } }
    ];
  }
  const { count: totalCount, rows: data } = await GxpServiceAssignmentGroupModel.findAndCountAll({
    where,
    distinct: true,
    include: [
      {
        association: "members",
        through: { attributes: ["userName"] }
      }
    ],
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });
  return {
    data: data.map(formatGroup),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const updateGroup = async (groupName: string, updateData: any) => {
  const group = await GxpServiceAssignmentGroupModel.findOne({ where: { groupName } });
  if (!group) return null;
  await group.update(updateData);
  return await findGroupById(group.id);
};

export const updateGroupById = async (id: string, updateData: any) => {
  const group = await GxpServiceAssignmentGroupModel.findByPk(id);
  if (!group) return null;

  const transaction = await sequelize.transaction();
  try {
    const payload: any = {
      groupName: updateData.groupName,
      description: updateData.description,
      isActive: updateData.isActive,
      modifiedOn: updateData.modifiedOn || new Date(),
      modifiedBy: updateData.modifiedBy
    };

    if (updateData.manager) {
      payload.managerUserId = updateData.manager.userId;
      payload.managerName = updateData.manager.name;
    }

    await group.update(payload, { transaction });

    if (updateData.members && Array.isArray(updateData.members)) {
      // Delete old members
      await AssignmentGroupMember.destroy({ where: { groupId: id }, transaction });
      // Bulk create new members
      const memberRecords = updateData.members.map((member: any) => ({
        groupId: id,
        userId: member.userId,
        userName: member.name
      }));
      await AssignmentGroupMember.bulkCreate(memberRecords, { transaction });
    }

    await transaction.commit();
    return await findGroupById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const disableGroup = async (groupName: string) => {
  return await updateGroup(groupName, { isActive: false });
};

export const enableGroup = async (groupName: string) => {
  return await updateGroup(groupName, { isActive: true });
};

export const searchGroups = async (searchTerm: string) => {
  const data = await GxpServiceAssignmentGroupModel.findAll({
    where: {
      groupName: { [Op.iLike]: `%${searchTerm}%` }
    },
    include: [
      {
        association: "members",
        through: { attributes: ["userName"] }
      }
    ]
  });
  return data.map(formatGroup);
};

export const deleteGroupById = async (id: string) => {
  const group = await GxpServiceAssignmentGroupModel.findByPk(id);
  if (!group) return null;
  await group.destroy();
  return formatGroup(group);
};

export const findGroupsByIds = async (ids: string[]) => {
  const data = await GxpServiceAssignmentGroupModel.findAll({
    where: { id: ids },
    include: [
      {
        association: "members",
        through: { attributes: ["userName"] }
      }
    ]
  });
  return data.map(formatGroup);
};

export const findGroupsByFilter = async (filter: any) => {
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }
  const data = await GxpServiceAssignmentGroupModel.findAll({
    where,
    include: [
      {
        association: "members",
        through: { attributes: ["userName"] }
      }
    ]
  });
  return data.map(formatGroup);
};

export const bulkDeleteGroups = async (ids: string[], session?: any) => {
  return await GxpServiceAssignmentGroupModel.destroy({
    where: { id: ids }
  });
};
