/** GXP's permission catalogue — codes are rows in the platform's own `permissions` table
 * (type: 'gxp_service'), not a second local catalogue. See ROLES_AND_ACCESS_MANAGEMENT.md
 * and backend/src/migrations/002-seed-reference-data.ts. */

export const GXP_ENTITIES = [
  "APPLICATION",
  "APPLICATION_MODULE",
  "SUPPLIER",
  "ENVIRONMENT",
  "SERVICE_REQUEST",
  "WORKFLOW",
  "ASSIGNMENT_GROUP",
  "USER",
  "ROLE"
] as const;

export type GxpEntity = (typeof GXP_ENTITIES)[number];

export const GXP_ACTIONS = ["VIEW", "CREATE", "UPDATE", "DELETE"] as const;
export type GxpAction = (typeof GXP_ACTIONS)[number];

export const permissionCode = (action: GxpAction, entity: string): string =>
  `GXP:${action}:${entity}`;
