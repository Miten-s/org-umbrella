import {
  createUserRepo,
  findAllUsersRepo,
  findUserByIdRepo,
  updateUserRepo,
  disableUserRepo,
  enableUserRepo
} from "../repo/gxp-service-users.repo";
import { fetchRolesFromAuthService } from "./inter-service-calls.service";

export const createUserService = async (data: any) => {
  return await createUserRepo(data);
};

export const getAllUsersService = async () => {
  const users = await findAllUsersRepo();
  return await Promise.all(
    users.map(async (user: any) => {
      return {
        ...user,
        roles: await fetchRolesFromAuthService(
          Array.isArray(user.roles) ? user.roles : [user.roles]
        )
      };
    })
  );
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
  return await enableUserRepo(id, comments);
};
