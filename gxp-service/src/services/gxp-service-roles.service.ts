import {
  createRoleRepo,
  findAllRolesRepo,
  findRoleByIdRepo,
  updateRoleRepo,
  disableRoleRepo,
  enableRoleRepo
} from "../repo/gxp-service-roles.repo";

export const createRoleService = async (data: any) => {
  return await createRoleRepo(data);
};

export const getAllRolesService = async () => {
  return await findAllRolesRepo();
};

export const updateRoleService = async (id: string, data: any) => {
  const existing = await findRoleByIdRepo(id);
  if (!existing) throw new Error("Role not found");
  return await updateRoleRepo(id, data);
};

export const disableRoleService = async (id: string) => {
  const existing = await findRoleByIdRepo(id);
  if (!existing) throw new Error("Role not found");
  return await disableRoleRepo(id);
};

export const enableRoleService = async (id: string, comments: any) => {
  const existing = await findRoleByIdRepo(id);
  if (!existing) throw new Error("Role not found");
  return await enableRoleRepo(id, comments);
};
