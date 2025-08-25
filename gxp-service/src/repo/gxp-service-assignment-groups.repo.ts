import { AssignmentGroupModel } from "../models/gxp-service-assignment-groups.model";

export const createGroup = async (data: any) => {
  return await AssignmentGroupModel.create(data);
};

export const getAllGroups = async () => {
  return await AssignmentGroupModel.find();
};

export const getGroupByName = async (groupName: string) => {
  return await AssignmentGroupModel.findOne({ groupName });
};

export const updateGroup = async (groupName: string, updateData: any) => {
  return await AssignmentGroupModel.findOneAndUpdate(
    { groupName },
    updateData,
    { new: true }
  );
};

export const disableGroup = async (groupName: string) => {
  return await AssignmentGroupModel.findOneAndUpdate(
    { groupName },
    { isActive: false },
    { new: true }
  );
};

export const enableGroup = async (groupName: string) => {
  return await AssignmentGroupModel.findOneAndUpdate(
    { groupName },
    { isActive: true },
    { new: true }
  );
};

export const searchGroups = async (searchTerm: string) => {
  return await AssignmentGroupModel.find({
    groupName: new RegExp(searchTerm, "i")
  });
};
