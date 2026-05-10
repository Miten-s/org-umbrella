import { PaginationOptions } from "../utils/pagination.util";
import {
  createGroup,
  disableGroup,
  enableGroup,
  getAllGroups,
  searchGroups,
  updateGroup,
  updateGroupById
} from "../repo/gxp-service-assignment-groups.repo";

export const addGroup = async (data: any) => {
  const newGroup = {
    ...data,
    createdOn: new Date(),
    modifiedOn: new Date(),
    isActive: true
  };

  return await createGroup(newGroup);
};


export const getAll = async (options: PaginationOptions) => {
  return await getAllGroups(options);
};
export const update = async (id: string, updateData: any) => {
  const { createdOn, createdBy, ...safeUpdateData } = updateData;

  return await updateGroupById(id, {
    ...safeUpdateData,
    modifiedOn: new Date()
  });
};

export const disable = async (groupName: string) => {
  return await disableGroup(groupName);
};

export const enable = async (groupName: string) => {
  return await enableGroup(groupName);
};

export const search = async (term: string) => {
  return await searchGroups(term);
};
