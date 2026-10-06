import { QueryTypes } from "sequelize";
import { IUser } from "../models/user.model";
import { AppError } from "../types/common.types";
import { sequelize } from "../configs/db.sequelize";

export const CUSTOM_MESSAGES = {
  ENTITY_CREATED: "{{ entity }} created successfully",
  ENTITY_UPDATED: "{{ entity }} updated successfully",
  ENTITY_DELETED: "{{ entity }} deleted successfully",
  NOT_FOUND: "{{entity}} not found",
  ALREADY_EXISTS: "{{entity}} already exists",
  NOT_AUTHORIZED: "{{entity}} is not authorized",
  FIELD_REQUIRED: "{{entity}} is required",
  INVALID_EMAIL_PASSWORD: "Invalid email or password",
  LOGIN_SUCCESSFUL: "Login successful",
  LOGOUT_SUCCESSFUL: "Logout successful",
  SOMETHING_WENT_WRONG: "Something went wrong",
  REFRESH_TOKEN_EXPRIED: "Authentication expired",
  TOKEN_EXPIRED: "Token Expired",
  USER_NOT_FOUND: "User not found",
  NOT_ACCESSIBLE: "This role has not access to this resource",
  BAD_REQUEST: "Bad Request",
  TOKEN_UPDATED: "Token updated successfully",
  PASSWORD_RESET_SUCCESSFUL: "Password Updated successful",
  CONNECTION_ERROR: "Connection error , Try Again Later!",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  CANNOT_FORGOT_SSO_USER: "SSO user cannot change password",
  TOKEN_MALFORMED: "Token is malformed",
  ROLE_ASSIGNED: "Role assigned successfully",
  ROLE_FETCHED: "Roles fetched successfully",
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
  HEALTHY_MESSAGE: "Permissions and roles services are LIVE!"
};

export const getMessage = (message: string, entity?: string) => {
  if (message.includes("ECONNREFUSED")) {
    return CUSTOM_MESSAGES.CONNECTION_ERROR;
  }
  return !entity ? message : message.replace("{{entity}}", entity);
};

export const convertMongooseError = (message: {
  code: number;
  entity: string;
}) => {
  if (message.code == 11000) {
    return getMessage(
      CUSTOM_MESSAGES.ALREADY_EXISTS,
      message.entity.charAt(0).toUpperCase() + message.entity.slice(1)
    );
  }
};

/** Every permission name across a user's roles, flattened. */
export const getUserPermissionNames = (user?: any): string[] =>
  (user?.roles ?? []).flatMap((role: any) =>
    (role.permissions ?? []).map((permission: any) => permission.name)
  );

/** Super Admin is the `OPERATE:ALL` permission, not an account name — a renamed or
 * re-emailed account must not lose (or a coincidentally-named one gain) the bypass. */
export const isSuperAdmin = (user?: IUser) => {
  if (!user) return false;
  return getUserPermissionNames(user).includes("OPERATE:ALL");
};

/** Every platform user id holding OPERATE:ALL — the query-level equivalent of `isSuperAdmin`,
 * for filtering/protecting Super Admin accounts in list/bulk operations (e.g. excluding them
 * from a manageable-users list, or refusing to bulk-delete/edit them) without relying on a
 * display name. That protection previously matched on `fullName === "superadmin"`, which
 * broke the moment the account was renamed — same bug `isSuperAdmin` above already fixed. */
export const getSuperAdminUserIds = async (): Promise<string[]> => {
  const rows = await sequelize.query<{ id: string }>(
    `SELECT DISTINCT u.id
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE p.name = 'OPERATE:ALL'`,
    { type: QueryTypes.SELECT }
  );
  return rows.map((row) => row.id);
};

export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error?.message === "string"
  );
};
