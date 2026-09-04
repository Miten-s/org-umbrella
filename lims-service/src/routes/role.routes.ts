import Role from "../models/role.model";
import RoleEntry from "../models/role-entry.model";
import Group from "../models/group.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import { CreateRoleDto, UpdateRoleDto } from "../dtos/master-data.dto";
import { invalidateAllUserContexts } from "../services/user-context.service";
import {
  ACTION_COLUMN,
  LimsAction,
  LIMS_ACTIONS,
  OPERATE_ALL
} from "../utils/permissions";

/** Lab Roles — the client has two shapes for the same data: `entries[]` (grid) and
 * `permissions[]` (flat codes). Stored one way (entries), returned both, so they can't disagree. */

/** "LIMS:CREATE:SAMPLE" → { entity: "SAMPLE", action: "CREATE" } */
const parseCode = (
  code: string
): { entity: string; action: LimsAction } | null => {
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
      attributes: [
        "id",
        "entry",
        "canView",
        "canCreate",
        "canEdit",
        "canRemove"
      ],
      required: false
    }
  ],
  relationFields: { group: "groupId" },

  // Folds the flat shape into the grid shape (`entries` wins if both are sent). `OPERATE:ALL`
  // is pulled out first — it's Role's own top-level column, not an entity permission code,
  // and without this split it silently parsed as garbage and never persisted.
  normalizePayload: (payload) => {
    const next = { ...payload };
    if (next.entries === undefined && next.permissions !== undefined) {
      const codes = next.permissions as string[];
      next.operateAll = codes.includes(OPERATE_ALL);
      next.entries = permissionsToEntries(
        codes.filter((code) => code !== OPERATE_ALL)
      );
      delete next.permissions;
    }
    return next;
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

  // Returns both shapes; `OPERATE:ALL` is stitched back in from the real `operateAll` column.
  postFormat: (row) => ({
    ...row,
    permissions: [
      ...(row.operateAll ? [OPERATE_ALL] : []),
      ...entriesToPermissions(row.entries)
    ]
  }),

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
