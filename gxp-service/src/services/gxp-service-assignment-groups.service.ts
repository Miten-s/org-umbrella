import {
  createGroup,
  disableGroup,
  enableGroup,
  getAllGroups,
  searchGroups,
  updateGroup
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

export const getAll = async () => {
  return await getAllGroups();
};

export const update = async (groupName: string, updateData: any) => {
  return await updateGroup(groupName, {
    ...updateData,
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
