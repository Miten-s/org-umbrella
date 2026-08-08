import { AppError } from "../types/common.types";

export const CUSTOM_MESSAGES = {
  ENTITY_CREATED: "{{ entity }} created successfully",
  ENTITY_UPDATED: "{{ entity }} updated successfully",
  ENTITY_DELETED: "{{ entity }} deleted successfully",
  ENTITY_RESTORED: "{{ entity }} restored successfully",
  NOT_FOUND: "{{entity}} not found",
  ALREADY_EXISTS: "{{entity}} already exists",
  NOT_AUTHORIZED: "Not authorized",
  FIELD_REQUIRED: "{{entity}} is required",
  SOMETHING_WENT_WRONG: "Something went wrong",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
  HEALTHY_MESSAGE: "LIMS Service is LIVE!",
  BAD_REQUEST: "Bad Request",
  PERMISSION_DENIED: "Permission denied",
  CHANGE_REASON_REQUIRED: "Change reason is required for this operation"
};

export const getMessage = (message: string, entity?: string): string => {
  return !entity ? message : message.replace("{{entity}}", entity);
};

export const isSuperAdmin = (user?: any): boolean => {
  if (!user) return false;
  return user.fullName === "superadmin";
};

export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
};
