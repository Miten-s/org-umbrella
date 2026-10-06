import { Op } from "sequelize";
import RoleGroup from "../models/role-group.model";
import Group from "../models/group.model";
import AuditLog from "../models/audit-log.model";
import { writeAudit } from "../utils/audit.util";
import { formatLimsEntity } from "../utils/format.util";
import { AccessScope, CrudContext } from "../utils/crud-factory";
import { ListQuery } from "../utils/pagination.util";
import { ACTION_COLUMN, LIMS_ACTIONS, OPERATE_ALL } from "../utils/permissions";
import {
  BackendRole,
  BackendRoleRejected,
  createRole,
  lookupRoles,
  queryRoles,
  setRolesRemoved,
  updateRole
} from "./backend-roles.client";
import {
  fromBackendPermission,
  toBackendPermission
} from "./permission.service";
import { invalidateAllUserContexts } from "./user-context.service";

/** Lab Roles: the definition (code, name, description, what it grants) is stored in
 * backend; LIMS keeps which lab group a role belongs to and its own audit trail. Shaped to
 * the same contract crud-factory's services follow, so the Lab Roles screen and API are
 * unchanged. */

const ENTITY_NAME = "Lab Role";
const PROTECTED_CODE = "LIMS_MASTER_ADMIN";
const PROTECTED_MESSAGE =
  '"LIMS Master Admin" is a protected system role and cannot be modified or deleted. ' +
  "A genuinely new master role needs its own migration, not an edit of this one.";

const fail = (message: string, statusCode: number): never => {
  throw Object.assign(new Error(message), { statusCode });
};

// ---------------------------------------------------------------------------
// Payload ↔ stored shape
// ---------------------------------------------------------------------------

type Entry = Record<string, any> & { entry: string };

const codesFromEntries = (entries: Entry[]): string[] =>
  entries.flatMap((entry) =>
    LIMS_ACTIONS.filter((action) => entry[ACTION_COLUMN[action]]).map(
      (action) => `LIMS:${action}:${entry.entry}`
    )
  );

const entriesFromCodes = (codes: string[]): Entry[] => {
  const byEntity = new Map<string, Entry>();
  for (const code of codes) {
    const [prefix, action, entity] = code.split(":");
    if (prefix !== "LIMS" || !entity) continue;
    const column = ACTION_COLUMN[action as keyof typeof ACTION_COLUMN];
    if (!column) continue;
    const row = byEntity.get(entity) ?? {
      entry: entity,
      canView: false,
      canCreate: false,
      canEdit: false,
      canRemove: false
    };
    row[column] = true;
    byEntity.set(entity, row);
  }
  return [...byEntity.values()];
};

/** The form sends either `permissions[]` codes or the `entries[]` grid (plus `operateAll`);
 * `entries` wins if both are present. Returns LIMS codes, "OPERATE:ALL" included. */
const requestedCodes = (raw: Record<string, any>): string[] | undefined => {
  if (Array.isArray(raw.entries)) {
    return [
      ...(raw.operateAll ? [OPERATE_ALL] : []),
      ...codesFromEntries(raw.entries)
    ];
  }
  if (Array.isArray(raw.permissions)) return raw.permissions as string[];
  return undefined;
};

/** A payload's group (`group` from the form, `groupId` from older callers). */
const requestedGroup = (
  raw: Record<string, any>
): string | null | undefined => {
  if ("group" in raw) return raw.group || null;
  if ("groupId" in raw) return raw.groupId || null;
  return undefined;
};

const toBackendInput = (raw: Record<string, any>) => {
  const codes = requestedCodes(raw);
  return {
    ...(raw.roleId !== undefined ? { code: raw.roleId } : {}),
    ...(raw.name !== undefined ? { name: raw.name } : {}),
    ...(raw.description !== undefined ? { description: raw.description } : {}),
    ...(codes ? { permissions: codes.map(toBackendPermission) } : {})
  };
};

const groupsFor = async (roleIds: string[]) => {
  if (!roleIds.length) return new Map<string, Group | null>();
  const links = (await RoleGroup.findAll({
    where: { roleId: roleIds },
    include: [{ model: Group, as: "group", attributes: ["id", "name"] }]
  })) as (RoleGroup & { group?: Group })[];
  return new Map(links.map((link) => [link.roleId, link.group ?? null]));
};

const shape = (role: BackendRole, group: Group | null | undefined) => {
  const permissions = role.permissions.map(fromBackendPermission);
  const groupRef = group
    ? { id: group.id, name: (group as any).name, _id: group.id }
    : null;
  return {
    id: role.id,
    _id: role.id,
    roleId: role.code ?? "",
    name: role.name,
    description: role.description,
    groupId: groupRef?.id ?? null,
    group: groupRef,
    operateAll: permissions.includes(OPERATE_ALL),
    entries: entriesFromCodes(permissions),
    permissions,
    isRemoved: role.isRemoved,
    deletedAt: role.deletedAt,
    createdAt: role.createdAt,
    modifiedOn: role.updatedAt,
    modifiedBy: null
  };
};

export type LabRole = ReturnType<typeof shape>;

const shapeAll = async (roles: BackendRole[]) => {
  const groups = await groupsFor(roles.map((r) => r.id));
  return roles.map((role) => shape(role, groups.get(role.id)));
};

// ---------------------------------------------------------------------------
// Lab-group scope — the same rule crud-factory applies to every grouped record
// ---------------------------------------------------------------------------

const scopeIsOpen = (scope: AccessScope) =>
  scope.operateAll || (scope.resolved && scope.accessGroupIds.length === 0);

/** Role ids this caller may not see: those in a lab group outside their access. */
const hiddenRoleIds = async (scope: AccessScope): Promise<string[]> => {
  if (scopeIsOpen(scope)) return [];
  const where = scope.resolved
    ? { groupId: { [Op.notIn]: scope.accessGroupIds } }
    : {};
  const links = await RoleGroup.findAll({ where, attributes: ["roleId"] });
  return links.map((link) => link.roleId);
};

const inScope = (scope: AccessScope, role: LabRole) => {
  if (scopeIsOpen(scope)) return true;
  if (!scope.resolved) return false;
  return !role.groupId || scope.accessGroupIds.includes(role.groupId);
};

const assertGroupInScope = (scope: AccessScope, groupId: string | null) => {
  if (!groupId || scopeIsOpen(scope)) return;
  if (!scope.resolved || !scope.accessGroupIds.includes(groupId)) {
    fail("That group is outside your access.", 403);
  }
};

const setGroup = async (roleId: string, groupId: string | null) => {
  if (groupId) await RoleGroup.upsert({ roleId, groupId });
  else await RoleGroup.destroy({ where: { roleId } });
};

const visible = async (ids: string[], ctx: CrudContext) => {
  const roles = await shapeAll(await lookupRoles(ids));
  return roles.filter((role) => inScope(ctx.scope, role));
};

const audit = (
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE",
  ctx: CrudContext,
  entityId: string,
  oldValue: LabRole | null,
  newValue: LabRole | null,
  changeReason?: string
) =>
  writeAudit({
    entityName: ENTITY_NAME,
    entityId,
    action,
    oldValue,
    newValue,
    changeReason: changeReason ?? null,
    actor: ctx.actor
  });

const assertNotProtected = (roles: LabRole[]) => {
  if (roles.some((role) => role.roleId === PROTECTED_CODE)) {
    fail(PROTECTED_MESSAGE, 403);
  }
};

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

const getAll = async (query: ListQuery, ctx: CrudContext) => {
  const { rows, count } = await queryRoles({
    search: query.search || undefined,
    filters: query.filters,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    page: query.page,
    limit: query.limit,
    includeRemoved: query.includeRemoved,
    excludeIds: await hiddenRoleIds(ctx.scope)
  });
  return { rows: await shapeAll(rows), count };
};

const getById = async (id: string, ctx: CrudContext) =>
  (await visible([id], ctx))[0] ?? null;

const create = async (raw: Record<string, any>, ctx: CrudContext) => {
  const groupId =
    requestedGroup(raw) === undefined
      ? ctx.scope.homeGroupId
      : (requestedGroup(raw) as string | null);
  assertGroupInScope(ctx.scope, groupId);

  const role = await createRole(
    toBackendInput(raw),
    { id: ctx.actor.id },
    raw.changeReason
  );
  await setGroup(role.id, groupId);
  const created = (await shapeAll([role]))[0];
  await audit("CREATE", ctx, role.id, null, created, raw.changeReason);
  await invalidateAllUserContexts();
  return created;
};

const update = async (
  id: string,
  raw: Record<string, any>,
  ctx: CrudContext
) => {
  const existing = await getById(id, ctx);
  if (!existing) return null;
  assertNotProtected([existing]);

  const groupId = requestedGroup(raw);
  if (groupId !== undefined) assertGroupInScope(ctx.scope, groupId);

  const role = await updateRole(
    id,
    toBackendInput(raw),
    { id: ctx.actor.id },
    raw.changeReason
  );
  if (groupId !== undefined) await setGroup(id, groupId);
  const updated = (await shapeAll([role]))[0];
  await audit("UPDATE", ctx, id, existing, updated, raw.changeReason);
  await invalidateAllUserContexts();
  return updated;
};

const setRemoved = async (
  ids: string[],
  removed: boolean,
  changeReason: string | undefined,
  ctx: CrudContext
) => {
  const roles = (await visible(ids, ctx)).filter(
    (role) => role.isRemoved !== removed
  );
  if (!roles.length) return 0;
  assertNotProtected(roles);

  const count = await setRolesRemoved(
    roles.map((role) => role.id),
    removed,
    { id: ctx.actor.id },
    changeReason
  );
  const after = new Map(
    (await shapeAll(await lookupRoles(roles.map((r) => r.id)))).map((r) => [
      r.id,
      r
    ])
  );
  for (const role of roles) {
    await audit(
      removed ? "DELETE" : "RESTORE",
      ctx,
      role.id,
      role,
      after.get(role.id) ?? null,
      changeReason
    );
  }
  await invalidateAllUserContexts();
  return count;
};

const remove = async (
  id: string,
  changeReason: string | undefined,
  ctx: CrudContext
) => {
  if (!(await getById(id, ctx))) return null;
  await setRemoved([id], true, changeReason, ctx);
  return true;
};

const restore = async (
  id: string,
  changeReason: string | undefined,
  ctx: CrudContext
) => {
  if (!(await getById(id, ctx))) return null;
  await setRemoved([id], false, changeReason, ctx);
  return getById(id, ctx);
};

const bulkUpdate = async (
  updates: { id: string; payload: Record<string, any> }[],
  changeReason: string | undefined,
  ctx: CrudContext
) => {
  const results: { id: string; skipped?: boolean }[] = [];
  for (const { id, payload } of updates) {
    const updated = await update(id, { ...payload, changeReason }, ctx);
    results.push(updated ? { id } : { id, skipped: true });
  }
  return results;
};

/** "CODE" → "CODE-(N)", with N one past the highest existing copy, like other entities. */
const nextCopy = async (code: string) => {
  const base = code.replace(/-\(\d+\)$/, "");
  const { rows } = await queryRoles({
    search: base,
    includeRemoved: true,
    limit: 500
  });
  const pattern = new RegExp(
    `^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:-\\((\\d+)\\))?$`,
    "i"
  );
  const highest = rows.reduce((max, row) => {
    const found = (row.code ?? "").match(pattern)?.[1];
    return found ? Math.max(max, parseInt(found, 10)) : max;
  }, 0);
  return `-(${highest + 1})`;
};

const bulkDuplicate = async (ids: string[], ctx: CrudContext) => {
  let count = 0;
  for (const source of await visible(ids, ctx)) {
    const suffix = await nextCopy(source.roleId || source.name);
    const base = (value: string) => value.replace(/-\(\d+\)$/, "");
    await create(
      {
        roleId: source.roleId ? `${base(source.roleId)}${suffix}` : null,
        name: `${base(source.name)}${suffix}`,
        description: source.description,
        group: source.groupId,
        permissions: source.permissions
      },
      ctx
    );
    count += 1;
  }
  return count;
};

/** Copy flow: each reviewed record saved on its own. A name or code clash gets the next
 * "-(N)" suffix and a warning instead of failing the batch, as for other entities. */
const bulkCreate = async (records: Record<string, any>[], ctx: CrudContext) => {
  const results: { id?: string; warning?: string; error?: string }[] = [];
  for (const record of records) {
    try {
      results.push({ id: (await create(record, ctx)).id });
    } catch (error) {
      if (!(error instanceof BackendRoleRejected) || error.statusCode !== 409) {
        results.push({ error: (error as Error).message });
        continue;
      }
      try {
        const suffix = await nextCopy(record.roleId || record.name);
        const renamed = {
          ...record,
          roleId: record.roleId ? `${record.roleId}${suffix}` : record.roleId,
          name: `${record.name}${suffix}`
        };
        const created = await create(renamed, ctx);
        results.push({
          id: created.id,
          warning: `"${record.name}" was already used — saved as "${renamed.name}".`
        });
      } catch (retryError) {
        results.push({ error: (retryError as Error).message });
      }
    }
  }
  return results;
};

const bulkDelete = (
  ids: string[],
  changeReason: string | undefined,
  ctx: CrudContext
) => setRemoved(ids, true, changeReason, ctx);

const bulkRestore = (
  ids: string[],
  changeReason: string | undefined,
  ctx: CrudContext
) => setRemoved(ids, false, changeReason, ctx);

const getAuditLogs = async (
  id: string,
  page: number,
  limit: number,
  ctx: CrudContext
) => {
  if (!(await getById(id, ctx))) return null;
  const { count, rows } = await AuditLog.findAndCountAll({
    where: { entityName: ENTITY_NAME, entityId: id },
    order: [["performedAt", "DESC"]],
    offset: (page - 1) * limit,
    limit
  });
  const logs = (formatLimsEntity(rows) as Record<string, any>[]).map((row) => ({
    ...row,
    entityName: ENTITY_NAME,
    uniqueId: row.id,
    who: row.performedByName ?? null,
    when: row.performedAt ?? null
  }));
  return { logs, total: count };
};

export const labRoleService = {
  getAll,
  getById,
  create,
  update,
  remove,
  restore,
  bulkUpdate,
  bulkDuplicate,
  bulkCreate,
  bulkDelete,
  bulkRestore,
  getAuditLogs
};

/** `{ id, roleId, name }` for Lab Role ids stored on other records (lab users, inspection
 * personnel). A read must not fail because backend is briefly away: unknown names are
 * left blank rather than throwing. */
export const labRoleRefs = async (
  ids: string[]
): Promise<
  Map<string, { id: string; _id: string; roleId: string; name: string }>
> => {
  const unique = [...new Set(ids.filter(Boolean))];
  let roles: BackendRole[] = [];
  try {
    roles = await lookupRoles(unique);
  } catch (error) {
    console.error("Lab Role names unavailable:", error);
  }
  const byId = new Map(roles.map((role) => [role.id, role]));
  return new Map(
    unique.map((id) => [
      id,
      {
        id,
        _id: id,
        roleId: byId.get(id)?.code ?? "",
        name: byId.get(id)?.name ?? ""
      }
    ])
  );
};
