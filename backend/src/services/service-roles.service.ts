import {
  Op,
  Transaction,
  UniqueConstraintError,
  WhereOptions
} from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { Role, RoleType } from "../models/role.model";
import { Permission } from "../models/permission.model";
import { IUser } from "../models/user.model";
import { recordRbacChange } from "./rbac-audit.service";
import { publishRbacInvalidation } from "./rbac-invalidation.publisher";

/** Role definitions owned by a service (LIMS, GXP). Backend is their only store; the
 * service in front decides who may change them (its own permissions and groups) and calls
 * this through the internal API. */

interface ServiceSpec {
  roleType: RoleType;
  permissionType: string;
  prefix: string;
  protectedNames: string[];
}

const SERVICES: Record<string, ServiceSpec> = {
  lims: {
    roleType: RoleType.LIMS_SERVICE,
    permissionType: "lims_service",
    prefix: "LIMS:",
    protectedNames: ["LIMS Master Admin"]
  },
  gxp: {
    roleType: RoleType.GXP_SERVICE,
    permissionType: "gxp_service",
    prefix: "GXP:",
    protectedNames: ["GXP Master Admin"]
  }
};

export class ServiceRoleError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export const serviceSpec = (service: string): ServiceSpec => {
  const spec = SERVICES[service];
  if (!spec) throw new ServiceRoleError(`Unknown service "${service}"`, 404);
  return spec;
};

export interface ServiceRoleView {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  permissions: string[];
  isRemoved: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRoleInput {
  code?: string | null;
  name?: string;
  description?: string | null;
  permissions?: string[];
}

export interface ServiceActor {
  id?: string;
  email?: string;
}

const toView = (role: Role): ServiceRoleView => {
  const json = role.toJSON() as any;
  return {
    id: json.id,
    code: json.code ?? null,
    name: json.name,
    description: json.description ?? null,
    permissions: (json.permissions ?? [])
      .map((p: { name: string }) => p.name)
      .sort(),
    isRemoved: Boolean(json.deletedAt),
    deletedAt: json.deletedAt ?? null,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt
  };
};

const withPermissions = {
  model: Permission,
  as: "permissions",
  attributes: ["id", "name"],
  through: { attributes: [] }
};

const SORTABLE: Record<string, string> = {
  name: "name",
  code: "code",
  roleId: "code",
  description: "description",
  modifiedOn: "updatedAt",
  updatedAt: "updatedAt",
  createdAt: "createdAt",
  isRemoved: "deletedAt"
};

export interface ServiceRoleListQuery {
  search?: string;
  filters?: Record<string, string>;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  page?: number;
  limit?: number;
  includeRemoved?: boolean;
  /** Roles the caller may not see (e.g. outside a LIMS user's lab groups). */
  excludeIds?: string[];
}

export const listServiceRoles = async (
  service: string,
  query: ServiceRoleListQuery
): Promise<{ rows: ServiceRoleView[]; count: number }> => {
  const spec = serviceSpec(service);
  const and: WhereOptions[] = [{ type: spec.roleType }];

  if (query.search) {
    const like = `%${query.search}%`;
    and.push({
      [Op.or]: [
        { name: { [Op.iLike]: like } },
        { code: { [Op.iLike]: like } },
        { description: { [Op.iLike]: like } }
      ]
    });
  }
  for (const [field, value] of Object.entries(query.filters ?? {})) {
    const column = SORTABLE[field];
    if (column && column !== "deletedAt" && value) {
      and.push({ [column]: { [Op.iLike]: `%${value}%` } });
    }
  }
  if (query.excludeIds?.length)
    and.push({ id: { [Op.notIn]: query.excludeIds } });

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(500, Math.max(1, query.limit ?? 20));
  const sortColumn = SORTABLE[query.sortBy ?? ""] ?? "name";

  const { rows, count } = await Role.findAndCountAll({
    where: { [Op.and]: and },
    paranoid: !query.includeRemoved,
    include: [withPermissions],
    order: [[sortColumn, query.sortDir ?? "ASC"]],
    offset: (page - 1) * limit,
    limit,
    distinct: true
  });
  return { rows: rows.map(toView), count };
};

export const getServiceRoles = async (
  service: string,
  ids: string[],
  includeRemoved = true
): Promise<ServiceRoleView[]> => {
  const spec = serviceSpec(service);
  if (!ids.length) return [];
  const roles = await Role.findAll({
    where: { id: ids, type: spec.roleType },
    paranoid: !includeRemoved,
    include: [withPermissions]
  });
  return roles.map(toView);
};

/** Permission names → ids, refusing anything outside this service's catalogue. */
const resolvePermissions = async (
  spec: ServiceSpec,
  names: string[],
  transaction: Transaction
): Promise<string[]> => {
  const unique = [...new Set(names)];
  if (!unique.length) return [];
  const found = await Permission.findAll({
    where: { name: unique, type: spec.permissionType },
    attributes: ["id", "name"],
    transaction
  });
  const known = new Set(found.map((p) => p.name));
  const unknown = unique.filter((name) => !known.has(name));
  if (unknown.length) {
    throw new ServiceRoleError(
      `Unknown permission(s): ${unknown.join(", ")}`,
      400
    );
  }
  return found.map((p) => p.id as string);
};

const assertNotProtected = (spec: ServiceSpec, role: Role) => {
  if (spec.protectedNames.includes(role.name)) {
    throw new ServiceRoleError(
      `"${role.name}" is a protected system role and cannot be modified or deleted.`,
      403
    );
  }
};

/** Names are unique across every role, deleted ones included; codes within a role type. */
const asConflict = (error: unknown): never => {
  if (error instanceof UniqueConstraintError) {
    // Postgres names the index that was hit: roles_type_code_unique for the code.
    const constraint = String((error.parent as any)?.constraint ?? "");
    const onCode = constraint === "roles_type_code_unique";
    throw new ServiceRoleError(
      onCode
        ? "That role code is already used by another role."
        : "That role name is already used by another role.",
      409
    );
  }
  throw error;
};

const loadOne = async (
  spec: ServiceSpec,
  id: string,
  transaction: Transaction
): Promise<Role> => {
  const role = await Role.findOne({
    where: { id, type: spec.roleType },
    paranoid: false,
    include: [withPermissions],
    transaction
  });
  if (!role) throw new ServiceRoleError("Role not found", 404);
  return role;
};

const auditActor = (actor?: ServiceActor) =>
  (actor?.id ? { id: actor.id, email: actor.email } : undefined) as
    IUser | undefined;

export const createServiceRole = async (
  service: string,
  input: ServiceRoleInput,
  actor?: ServiceActor,
  reason?: string
): Promise<ServiceRoleView> => {
  const spec = serviceSpec(service);
  if (!input.name?.trim()) {
    throw new ServiceRoleError("A role needs a name.", 400);
  }
  const created = await sequelize
    .transaction(async (transaction) => {
      const permissionIds = await resolvePermissions(
        spec,
        input.permissions ?? [],
        transaction
      );
      const role = await Role.create(
        {
          name: input.name!.trim(),
          type: spec.roleType,
          code: input.code?.trim() || null,
          description: input.description ?? null
        },
        { transaction }
      );
      await (role as any).setPermissions(permissionIds, { transaction });
      const view = toView(await loadOne(spec, role.id, transaction));
      await recordRbacChange(
        {
          actor: auditActor(actor),
          action: "ROLE_CREATE",
          targetType: "role",
          targetId: view.id,
          targetName: view.name,
          afterState: view,
          reason: reason ?? null
        },
        transaction
      );
      return view;
    })
    .catch(asConflict);
  await publishRbacInvalidation({ scope: "all" });
  return created;
};

export const updateServiceRole = async (
  service: string,
  id: string,
  input: ServiceRoleInput,
  actor?: ServiceActor,
  reason?: string
): Promise<ServiceRoleView> => {
  const spec = serviceSpec(service);
  const updated = await sequelize
    .transaction(async (transaction) => {
      const role = await loadOne(spec, id, transaction);
      assertNotProtected(spec, role);
      const before = toView(role);

      const changes: Partial<Role> = {};
      if (input.name !== undefined) {
        if (!input.name.trim()) {
          throw new ServiceRoleError("A role needs a name.", 400);
        }
        changes.name = input.name.trim();
      }
      if (input.code !== undefined) changes.code = input.code?.trim() || null;
      if (input.description !== undefined) {
        changes.description = input.description;
      }
      if (Object.keys(changes).length) {
        await role.update(changes, { transaction });
      }
      if (input.permissions !== undefined) {
        const permissionIds = await resolvePermissions(
          spec,
          input.permissions,
          transaction
        );
        await (role as any).setPermissions(permissionIds, { transaction });
        // setPermissions alone leaves updated_at untouched; "modified on" must move.
        await sequelize.query(
          `UPDATE roles SET updated_at = now() WHERE id = :id`,
          { replacements: { id }, transaction }
        );
      }

      const after = toView(await loadOne(spec, id, transaction));
      await recordRbacChange(
        {
          actor: auditActor(actor),
          action: "ROLE_UPDATE",
          targetType: "role",
          targetId: id,
          targetName: after.name,
          beforeState: before,
          afterState: after,
          reason: reason ?? null
        },
        transaction
      );
      return after;
    })
    .catch(asConflict);
  await publishRbacInvalidation({ scope: "all" });
  return updated;
};

/** Soft-deletes (`remove`) or restores roles; returns how many actually changed. */
export const setServiceRolesRemoved = async (
  service: string,
  ids: string[],
  removed: boolean,
  actor?: ServiceActor,
  reason?: string
): Promise<number> => {
  const spec = serviceSpec(service);
  if (!ids.length) return 0;
  const changed = await sequelize
    .transaction(async (transaction) => {
      const roles = await Role.findAll({
        where: { id: ids, type: spec.roleType },
        paranoid: false,
        transaction
      });
      let count = 0;
      for (const role of roles) {
        if (Boolean(role.deletedAt) === removed) continue;
        assertNotProtected(spec, role);
        if (removed) await role.destroy({ transaction });
        else await role.restore({ transaction });
        await recordRbacChange(
          {
            actor: auditActor(actor),
            action: removed ? "ROLE_DELETE" : "ROLE_RESTORE",
            targetType: "role",
            targetId: role.id,
            targetName: role.name,
            reason: reason ?? null
          },
          transaction
        );
        count += 1;
      }
      return count;
    })
    .catch(asConflict);
  if (changed) await publishRbacInvalidation({ scope: "all" });
  return changed;
};

export interface CatalogueEntry {
  name: string;
  description?: string;
}

/** A service registers its own permission vocabulary (it is defined in that service's
 * code). New names are added, descriptions kept current, and names the service no longer
 * defines are removed from every role and deleted, so a retired permission can't stay
 * granted. */
export const registerPermissionCatalogue = async (
  service: string,
  entries: CatalogueEntry[]
): Promise<{ added: number; updated: number; removed: number }> => {
  const spec = serviceSpec(service);
  const wanted = new Map(
    entries
      .filter((e) => e.name?.startsWith(spec.prefix))
      .map((e) => [e.name, e.description ?? e.name])
  );
  if (!wanted.size) {
    throw new ServiceRoleError("No permissions in this catalogue.", 400);
  }

  const result = await sequelize.transaction(async (transaction) => {
    const existing = await Permission.findAll({
      where: { type: spec.permissionType },
      paranoid: false,
      transaction
    });
    const byName = new Map(existing.map((p) => [p.name, p]));
    let added = 0;
    let updated = 0;

    for (const [name, description] of wanted) {
      const row = byName.get(name);
      if (!row) {
        await Permission.create(
          { name, description, type: spec.permissionType } as any,
          { transaction }
        );
        added += 1;
      } else if ((row as any).deletedAt || row.description !== description) {
        if ((row as any).deletedAt) await row.restore({ transaction });
        await row.update({ description }, { transaction });
        updated += 1;
      }
    }

    const stale = existing.filter(
      (p) => !wanted.has(p.name) && !(p as any).deletedAt
    );
    if (stale.length) {
      const staleIds = stale.map((p) => p.id as string);
      await sequelize.query(
        `DELETE FROM role_permissions WHERE permission_id IN (:ids)`,
        { replacements: { ids: staleIds }, transaction }
      );
      await Permission.destroy({ where: { id: staleIds }, transaction });
    }
    return { added, updated, removed: stale.length };
  });

  if (result.removed) await publishRbacInvalidation({ scope: "all" });
  return result;
};

/** This service's permissions, for its role form's picker. */
export const listServicePermissions = async (service: string) => {
  const spec = serviceSpec(service);
  const rows = await Permission.findAll({
    where: { type: spec.permissionType },
    attributes: ["id", "name", "description"],
    order: [["name", "ASC"]]
  });
  return rows.map((p) => ({
    id: p.id as string,
    name: p.name,
    description: p.description ?? null
  }));
};
