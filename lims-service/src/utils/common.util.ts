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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "test_id" -> "Test", "component_id" -> "Component". Never a raw DB column in a user-facing message. */
const humanizeField = (raw: string): string => {
  const label = raw.trim().replace(/_id$/i, "").replace(/[_-]+/g, " ").trim();
  return label ? label.replace(/\b\w/g, (c) => c.toUpperCase()) : "record";
};

/** A friendly "already exists" message for a uniqueness conflict — never a raw UUID or
 * snake_case column name. The value is shown only when it's something a lab analyst actually typed.
 */
export const friendlyUniqueConflictMessage = (fields: string[], values: unknown[] = []): string => {
  const fieldLabel = fields.filter(Boolean).map(humanizeField).join(" + ") || "record";
  const shown = values
    .filter((v): v is string | number => v !== undefined && v !== null && v !== "")
    .filter((v) => !UUID_RE.test(String(v)));
  return shown.length
    ? `A record with this ${fieldLabel} already exists: "${shown.join(", ")}".`
    : `A record with this ${fieldLabel} already exists.`;
};

export const removeUndefinedEntries = <T extends Record<string, unknown>>(obj: T): T => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};
