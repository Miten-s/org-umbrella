import GxpServiceAssignmentGroupModel from "../models/gxp-service-assignment-groups.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

export const createGroup = async (data: any) => {
  return await GxpServiceAssignmentGroupModel.create(data);
};


export const getAllGroups = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const filter: any = {};
  if (search) {
    const sanitizedSearch = escapeRegex(search);
    filter.$or = [
      { groupName: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    ];
  }
  const [data, totalCount] = await Promise.all([
    GxpServiceAssignmentGroupModel.find(filter).skip(skip).limit(limit).lean(),
    GxpServiceAssignmentGroupModel.countDocuments(filter).exec()
  ]);
  return {
    data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const updateGroup = async (groupName: string, updateData: any) => {
  return await GxpServiceAssignmentGroupModel.findOneAndUpdate(
    { groupName },
    updateData,
    { new: true }
  );
};

export const disableGroup = async (groupName: string) => {
  return await GxpServiceAssignmentGroupModel.findOneAndUpdate(
    { groupName },
    { isActive: false },
    { new: true }
  );
};

export const enableGroup = async (groupName: string) => {
  return await GxpServiceAssignmentGroupModel.findOneAndUpdate(
    { groupName },
    { isActive: true },
    { new: true }
  );
};

export const searchGroups = async (searchTerm: string) => {
  return await GxpServiceAssignmentGroupModel.find({
    groupName: new RegExp(searchTerm, "i")
  });
};
