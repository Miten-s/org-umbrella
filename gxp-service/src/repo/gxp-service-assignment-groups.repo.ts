import GxpServiceAssignmentGroupModel from "../models/gxp-service-assignment-groups.model";

export const createGroup = async (data: any) => {
  return await GxpServiceAssignmentGroupModel.create(data);
};

export const getAllGroups = async () => {
  return await GxpServiceAssignmentGroupModel.find();
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
