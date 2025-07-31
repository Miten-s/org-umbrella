import mongoose from "mongoose";
import { AppError } from "../types/common.types";

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

export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error?.message === "string"
  );
};

export const generateCustomId = (prefix: string) => {
  const oid = new mongoose.Types.ObjectId().toHexString();
  return `${prefix}~${oid}`;
};
