import Role from "../models/role.model";
import RoleEntry from "../models/role-entry.model";
import Group from "../models/group.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateRoleDto, UpdateRoleDto } from "../dtos/master-data.dto";
import { invalidateAllUserContexts } from "../services/user-context.service";
import { ACTION_COLUMN, LimsAction, LIMS_ACTIONS } from "../utils/permissions";

/**
 * Lab Roles.
 *
 * The client has two shapes for the same data and both are accepted:
 *  - `entries[]` — the Permissions grid: one row per entity, four checkboxes.
 *  - `permissions[]` — a flat list of catalogue codes ("LIMS:CREATE:SAMPLE").
 *
 * They are stored one way (a row per entity with four booleans, which is a
 * quarter of the rows) and returned both ways, so neither client has to change
 * and the two can't disagree about what a role grants.
 */

/** "LIMS:CREATE:SAMPLE" → { entity: "SAMPLE", action: "CREATE" } */
const parseCode = (code: string): { entity: string; action: LimsAction } | null => {
  const [prefix, action, entity] = code.split(":");
  if (prefix !== "LIMS" || !action || !entity) return null;
  if (!LIMS_ACTIONS.includes(action as LimsAction)) return null;
  return { entity, action: action as LimsAction };
};

/** Folds a flat `permissions[]` into the stored grid shape. */
const permissionsToEntries = (codes: string[]): Record<string, any>[] => {
  const byEntity = new Map<string, Record<string, any>>();

  for (const code of codes) {
    const parsed = parseCode(code);
    if (!parsed) continue;

    const row = byEntity.get(parsed.entity) ?? {
      entry: parsed.entity,
      canView: false,
      canCreate: false,
      canEdit: false,
      canRemove: false
    };
    row[ACTION_COLUMN[parsed.action]] = true;
    byEntity.set(parsed.entity, row);
  }

  return [...byEntity.values()];
};

/** Expands the stored grid back into flat catalogue codes. */
const entriesToPermissions = (entries: Record<string, any>[] = []): string[] =>
  entries.flatMap((entry) =>
    LIMS_ACTIONS.filter((action) => entry[ACTION_COLUMN[action]]).map(
      (action) => `LIMS:${action}:${entry.entry}`
    )
  );

export const roleConfig: CrudConfig<Role> = {
  model: Role,
  entityName: "Lab Role",
  permissionEntity: "ROLE",
  uniqueField: "roleId",
  searchFields: ["roleId", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: RoleEntry,
      as: "entries",
      attributes: ["id", "entry", "canView", "canCreate", "canEdit", "canRemove"],
      required: false
    }
  ],
  relationFields: { group: "groupId" },

  // Accept the flat shape by folding it into the grid shape before anything
  // else looks at the payload. `entries` wins if a client somehow sends both.
  normalizePayload: (payload) => {
    if (payload.entries !== undefined || payload.permissions === undefined) return payload;
    const { permissions, ...rest } = payload;
    return { ...rest, entries: permissionsToEntries(permissions as string[]) };
  },

  children: [
    {
      field: "entries",
      model: RoleEntry,
      foreignKey: "roleId",
      fields: ["entry", "canView", "canCreate", "canEdit", "canRemove"],
      matchKey: "entry"
    }
  ],

  // Return both shapes so either client works unchanged.
  postFormat: (row) => ({ ...row, permissions: entriesToPermissions(row.entries) }),

  // A permission change must take effect on the very next request.
  afterWrite: invalidateAllUserContexts
};

const service = buildCrudService(roleConfig);

export default buildCrudRouter({
  service,
  entityName: roleConfig.entityName,
  permissionEntity: roleConfig.permissionEntity,
  createDto: CreateRoleDto,
  updateDto: UpdateRoleDto
});
