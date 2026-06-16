import GxpServiceAssignmentGroupModel from "../models/gxp-service-assignment-groups.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";

const formatGroup = (group: any) => {
  if (!group) return null;
  const json = group.toJSON ? group.toJSON() : { ...group };
  json._id = json.id;
  return json;
};

export const createGroup = async (data: any) => {
  const doc = await GxpServiceAssignmentGroupModel.create(data);
  return formatGroup(doc);
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
  return formatGroup(group);
};

export const updateGroupById = async (id: string, updateData: any) => {
  const group = await GxpServiceAssignmentGroupModel.findByPk(id);
  if (!group) return null;
  await group.update(updateData);
  return formatGroup(group);
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
    }
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
    where: { id: ids }
  });
  return data.map(formatGroup);
};

export const findGroupsByFilter = async (filter: any) => {
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }
  const data = await GxpServiceAssignmentGroupModel.findAll({ where });
  return data.map(formatGroup);
};

export const bulkDeleteGroups = async (ids: string[], session?: any) => {
  return await GxpServiceAssignmentGroupModel.destroy({
    where: { id: ids }
  });
};
