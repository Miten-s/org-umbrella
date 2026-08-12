export const CUSTOM_MESSAGES = {
  ENTITY_CREATED: "{{entity}} created successfully",
  ENTITY_UPDATED: "{{entity}} updated successfully",
  ENTITY_DELETED: "{{entity}} removed successfully",
  ENTITY_RESTORED: "{{entity}} restored successfully",
  NOT_FOUND: "{{entity}} not found",
  ALREADY_EXISTS: "{{entity}} already exists",
  BAD_REQUEST: "Bad Request",
  SOMETHING_WENT_WRONG: "Something went wrong",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
  HEALTHY_MESSAGE: "LIMS service is LIVE!",
  CONNECTION_ERROR: "Connection error, try again later!"
};

export const getMessage = (message: string, entity?: string) => {
  if (message.includes("ECONNREFUSED")) {
    return CUSTOM_MESSAGES.CONNECTION_ERROR;
  }
  return !entity ? message : message.replace("{{entity}}", entity);
};

export const removeUndefinedEntries = <T extends Record<string, unknown>>(obj: T): T => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};
