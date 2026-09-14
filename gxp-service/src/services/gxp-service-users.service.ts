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
import { invalidateUserContext } from "./user-context.service";
import { PaginationOptions } from "../utils/pagination.util";

export const createUserService = async (data: any) => {
  const created = await createUserRepo(data);
  if (data.user?.id) await invalidateUserContext(data.user.id);
  return created;
};

export const getAllUsersService = async (
  options: PaginationOptions,
  includeDisabled = false
) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";
  const result = await findAllUsersRepo(filter, options);
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

export const getUserService = async (id: string) => {
  const user = await findUserByIdRepo(id);
  if (!user) return null;
  return {
    ...user,
    roles: await fetchRolesFromAuthService(
      Array.isArray((user as any).roles)
        ? (user as any).roles
        : [(user as any).roles]
    )
  };
};

export const updateUserService = async (id: string, data: any) => {
  const existing = await findUserByIdRepo(id);
  if (!existing) throw new Error("User not found");
  const updated = await updateUserRepo(id, data);
  await invalidateUserContext((existing as any).authUserId);
  return updated;
};

export const disableUserService = async (id: any) => {
  const existing = await findUserByIdRepo(id);
  if (!existing) throw new Error("User not found");
  const result = await disableUserRepo(id);
  await invalidateUserContext((existing as any).authUserId);
  return result;
};

export const enableUserService = async (id: any, comments: any) => {
  const existing = await findUserByIdRepo(id);
  if (!existing) throw new Error("User not found");
  const result = await enableUserRepo(id, comments);
  await invalidateUserContext((existing as any).authUserId);
  return result;
};

export const deleteUserService = async (id: string) => {
  const existing = await findUserByIdRepo(id);
  if (!existing) throw new Error("User not found");
  const result = await deleteUserRepo(id);
  await invalidateUserContext((existing as any).authUserId);
  return result;
};

export const bulkDeleteUsersService = async (ids: string[]) => {
  const existing = await Promise.all(ids.map((id) => findUserByIdRepo(id)));
  const result = await bulkDeleteUsersRepo(ids);
  await Promise.all(
    existing
      .filter(Boolean)
      .map((user: any) => invalidateUserContext(user.authUserId))
  );
  return result;
};
