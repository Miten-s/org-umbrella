import {
  createUserRepo,
  findAllUsersRepo,
  findUserByIdRepo,
  updateUserRepo,
  disableUserRepo,
  enableUserRepo,
  deleteUserRepo,
  bulkDeleteUsersRepo
} from "../repo/gxp-service-users.repo";
import { fetchRolesFromAuthService } from "./inter-service-calls.service";
import { PaginationOptions } from "../utils/pagination.util";

export const createUserService = async (data: any) => {
  return await createUserRepo(data);
};

export const getAllUsersService = async (options: PaginationOptions) => {
  const result = await findAllUsersRepo(options);
  const usersWithRoles = await Promise.all(
    result.data.map(async (user: any) => {
      return {
        ...user,
        roles: await fetchRolesFromAuthService(
          Array.isArray(user.roles) ? user.roles : [user.roles]
        )
      };
    })
  );
  return { ...result, data: usersWithRoles };
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

export const deleteUserService = async (id: string) => {
  const existing = await findUserByIdRepo(id);
  if (!existing) throw new Error("User not found");
  return await deleteUserRepo(id);
};

export const bulkDeleteUsersService = async (ids: string[]) => {
  return await bulkDeleteUsersRepo(ids);
};
