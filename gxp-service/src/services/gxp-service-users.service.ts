import {
  createUserRepo,
  findAllUsersRepo,
  findUserByIdRepo,
  updateUserRepo,
  disableUserRepo,
  enableUserRepo
} from "../repo/gxp-service-users.repo";

export const createUserService = async (data: any) => {
  return await createUserRepo(data);
};

export const getAllUsersService = async () => {
  return await findAllUsersRepo();
};

export const updateUserService = async (id: string, data: any) => {
  const existing = await findUserByIdRepo(id);
  if (!existing) throw new Error("User not found");
  return await updateUserRepo(id, data);
};

export const disableUserService = async (id: any) => {
  const existing = await findUserByIdRepo(id);
  if (!existing) throw new Error("User not found");
  return await disableUserRepo(id);
};

export const enableUserService = async (id: any, comments: any) => {
  const existing = await findUserByIdRepo(id);
  if (!existing) throw new Error("User not found");
  console.log('comments:', comments);
  return await enableUserRepo(id, comments);
};
