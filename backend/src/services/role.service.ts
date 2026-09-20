import { Request } from "express";
import { IUser, User } from "../models/user.model";
import { Role, RoleType } from "../models/role.model";
import { Permission } from "../models/permission.model";
import { isSuperAdmin, getUserPermissionNames } from "../utils/common.util";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { publishRbacInvalidation } from "./rbac-invalidation.publisher";

/** A role editor can't grant permissions they don't themselves hold — otherwise a
 * CREATE:ROLE/UPDATE:ROLE grant alone becomes a path to self-escalation. Super Admin
 * (OPERATE:ALL) is the one exception, by definition. */
const assertNoEscalation = async (
  requester: IUser | undefined,
  permissionIds?: string[]
) => {
  if (!permissionIds || permissionIds.length === 0) return;
  if (isSuperAdmin(requester)) return;

  const requested = await Permission.findAll({ where: { id: permissionIds } });
  const requesterNames = new Set(getUserPermissionNames(requester));
  const disallowed = requested
    .map((p) => p.name)
    .filter((name) => !requesterNames.has(name));

  if (disallowed.length > 0) {
    throw Object.assign(
      new Error(
        `You cannot grant permissions you don't hold yourself: ${disallowed.join(", ")}`
      ),
      { statusCode: 403 }
    );
  }
};

/** Which role `type`s a requester may create/update/delete. Route-level `checkPermissions`
 * only proves "some ROLE permission" — without this, a GXP-only admin (added so they can
 * manage Gxp_Service roles) could otherwise reach platform Custom/Built_In roles by id, and
 * a plain platform CREATE:ROLE holder could touch the system's own Built_In roles. */
const authorizedRoleTypes = (requester?: IUser): RoleType[] => {
  if (isSuperAdmin(requester)) {
    return [RoleType.CUSTOM, RoleType.BUILT_IN, RoleType.GXP_SERVICE];
  }
  const names = new Set(getUserPermissionNames(requester));
  const types: RoleType[] = [];
  if (
    names.has("CREATE:ROLE") ||
    names.has("UPDATE:ROLE") ||
    names.has("DELETE:ROLE") ||
    names.has("VIEW:ROLE")
  ) {
    types.push(RoleType.CUSTOM);
  }
  if (
    names.has("GXP:CREATE:ROLE") ||
    names.has("GXP:UPDATE:ROLE") ||
    names.has("GXP:DELETE:ROLE") ||
    names.has("GXP:VIEW:ROLE")
  ) {
    types.push(RoleType.GXP_SERVICE);
  }
  return types;
};

const assertRoleTypeAuthority = (
  requester: IUser | undefined,
  type: RoleType
) => {
  if (!authorizedRoleTypes(requester).includes(type)) {
    throw Object.assign(
      new Error(`You are not authorized to manage ${type} roles.`),
      { statusCode: 403 }
    );
  }
};

/** The one seeded, fixed fixture per system-wide tier — locked for everyone, Super Admin
 * included, so it can't be weakened or deleted by accident. A genuinely new master role is a
 * new migration, not an edit of this one. GXP Master Admin is the service-level counterpart
 * (see backend/src/migrations/018-seed-gxp-master-admin-role.ts); LIMS Master Admin is
 * protected the same way inside lims-service's own role.routes.ts, since it lives in a
 * separate database this service never touches. */
const PROTECTED_ROLE_NAMES = new Set(["Super Admin", "GXP Master Admin"]);

const assertNotProtectedRole = (name: string) => {
  if (PROTECTED_ROLE_NAMES.has(name)) {
    throw Object.assign(
      new Error(
        `"${name}" is a protected system role and cannot be modified or deleted.`
      ),
      { statusCode: 403 }
    );
  }
};

const formatRole = (role: any) => {
  if (!role) return null;
  const json = role.toJSON ? role.toJSON() : { ...role };
  json._id = json.id;
  if (json.permissions) {
    json.permissions = json.permissions.map((p: any) => {
      const pJson = p.toJSON ? p.toJSON() : { ...p };
      pJson._id = pJson.id;
      return pJson;
    });
  }
  return json;
};

const assignRole = async (req: Request) => {
  const user = await User.findOne({
    where: { email: req.body.email?.trim().toLowerCase() }
  });
  if (!user) return null;
  const role = await Role.findByPk(req.body.role);
  if (role) {
    await (user as any).addRole(role);
    await publishRbacInvalidation({ scope: "user", platformUserId: user.id });
  }
  return user;
};

const createRole = async (req: Request) => {
  const { name, permissions, type } = req.body;
  assertRoleTypeAuthority(req.user as IUser, type ?? RoleType.CUSTOM);
  await assertNoEscalation(req.user as IUser, permissions);
  const t = await sequelize.transaction();
  try {
    const role = await Role.create({ name, type }, { transaction: t });
    if (permissions && permissions.length > 0) {
      await (role as any).setPermissions(permissions, { transaction: t });
    }
    await t.commit();
    // After commit, never before — a subscriber that re-reads on this signal must not
    // see pre-commit state.
    await publishRbacInvalidation({ scope: "all" });

    const reloaded = await Role.findByPk(role.id, {
      include: ["permissions"]
    });
    return formatRole(reloaded);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updateRole = async (req: Request) => {
  const { name, permissions, type } = req.body;
  const t = await sequelize.transaction();
  try {
    const role = await Role.findByPk(req.params.id as string);
    if (!role) throw new Error("Role not found");
    assertNotProtectedRole(role.name);
    assertRoleTypeAuthority(req.user as IUser, role.type);
    if (type && type !== role.type) {
      assertRoleTypeAuthority(req.user as IUser, type);
    }
    await assertNoEscalation(req.user as IUser, permissions);
    await role.update({ name, type }, { transaction: t });
    if (permissions !== undefined) {
      await (role as any).setPermissions(permissions, { transaction: t });
    }
    await t.commit();
    await publishRbacInvalidation({ scope: "all" });

    const reloaded = await Role.findByPk(role.id, {
      include: ["permissions"]
    });
    return formatRole(reloaded);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteRole = async (req: Request) => {
  const t = await sequelize.transaction();
  try {
    const role = await Role.findByPk(req.params.id as string, {
      include: ["permissions"]
    });
    if (!role) return null;
    assertNotProtectedRole(role.name);
    assertRoleTypeAuthority(req.user as IUser, role.type);
    await role.destroy({ transaction: t });

    // Clean up references in junction tables
    await sequelize.query(`DELETE FROM user_roles WHERE role_id = :id`, {
      replacements: { id: req.params.id },
      transaction: t
    });
    await sequelize.query(`DELETE FROM role_permissions WHERE role_id = :id`, {
      replacements: { id: req.params.id },
      transaction: t
    });

    await t.commit();
    await publishRbacInvalidation({ scope: "all" });
    return formatRole(role);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const getRoles = async (
  options: PaginationOptions,
  user?: IUser,
  type?: string
) => {
  const { page, limit, skip, search } = options;
  let where: any = { type: RoleType.CUSTOM };
  const canManageGxpRoles =
    isSuperAdmin(user) ||
    getUserPermissionNames(user).includes("GXP:CREATE:ROLE");

  if (type) {
    where = { type };
  } else if (isSuperAdmin(user)) {
    where = {
      type: {
        [Op.in]: [RoleType.CUSTOM, RoleType.BUILT_IN, RoleType.GXP_SERVICE]
      }
    };
  } else if (canManageGxpRoles) {
    // A GXP-side admin manages Gxp_Service roles here too — reusing the platform's
    // Role/Permission tables (see plan) rather than a second, GXP-local role screen.
    where = { type: { [Op.in]: [RoleType.CUSTOM, RoleType.GXP_SERVICE] } };
  }

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  const { count: totalCount, rows: data } = await Role.findAndCountAll({
    where,
    distinct: true,
    offset: skip,
    limit,
    include: ["permissions"],
    order: [["created_at", "DESC"]]
  });

  return {
    roles: data.map(formatRole),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const bulkDeleteRoles = async (ids: string[]) => {
  const t = await sequelize.transaction();
  try {
    const protectedRoles = await Role.findAll({
      where: { id: ids, name: [...PROTECTED_ROLE_NAMES] },
      attributes: ["id", "name"],
      transaction: t
    });
    const protectedIds = protectedRoles.map((role) => role.id);
    const deletableIds = ids.filter((id) => !protectedIds.includes(id));

    // A batch of ONLY protected roles must be rejected outright, not silently no-op —
    // an empty `deletableIds` would otherwise reach the raw `IN (:ids)` queries below with
    // nothing to interpolate, which is a SQL syntax error, not a clean failure.
    if (deletableIds.length === 0 && ids.length > 0) {
      const names = protectedRoles.map((role) => `"${role.name}"`).join(", ");
      throw Object.assign(
        new Error(
          `${names} ${protectedRoles.length > 1 ? "are protected system roles" : "is a protected system role"} and cannot be modified or deleted.`
        ),
        { statusCode: 403 }
      );
    }

    await Role.destroy({
      where: { id: deletableIds },
      transaction: t
    });

    if (deletableIds.length > 0) {
      // Cascade: remove deleted role refs from all user_roles
      await sequelize.query(`DELETE FROM user_roles WHERE role_id IN (:ids)`, {
        replacements: { ids: deletableIds },
        transaction: t
      });

      // Cascade: remove deleted role refs from all role_permissions
      await sequelize.query(
        `DELETE FROM role_permissions WHERE role_id IN (:ids)`,
        {
          replacements: { ids: deletableIds },
          transaction: t
        }
      );
    }

    await t.commit();
    await publishRbacInvalidation({ scope: "all" });
    return { success: true, message: "Roles deleted successfully" };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const bulkDuplicateRoles = async (ids: string[]) => {
  const t = await sequelize.transaction();
  try {
    const sourceRoles = await Role.findAll({
      where: { id: ids },
      include: ["permissions"],
      transaction: t
    });
    if (!sourceRoles || sourceRoles.length === 0) {
      throw new Error("Roles not found");
    }
    for (const role of sourceRoles) assertNotProtectedRole(role.name);

    const duplicatedRoles = [];

    for (const sourceRole of sourceRoles) {
      let baseName = sourceRole.name;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexStr = `^${escapedBaseName}(?:-\\(([0-9]+)\\))?$`;

      const similarRolesResult = await Role.findAll({
        attributes: ["name"],
        where: {
          name: { [Op.iRegexp]: regexStr }
        },
        transaction: t
      });

      let maxIndex = 0;
      similarRolesResult.forEach((role: any) => {
        const match = role.name.match(new RegExp(regexStr, "i"));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const savedRole = await Role.create(
        {
          name: newName,
          type: RoleType.CUSTOM,
          deletedAt: null
        } as any,
        { transaction: t }
      );

      if (sourceRole.permissions && sourceRole.permissions.length > 0) {
        const permIds = sourceRole.permissions.map((p: any) => p.id);
        await (savedRole as any).setPermissions(permIds, { transaction: t });
      }

      duplicatedRoles.push(savedRole);
    }

    await t.commit();
    await publishRbacInvalidation({ scope: "all" });

    // Fetch duplicated roles with permissions populated
    const dupIds = duplicatedRoles.map((r) => r.id);
    const populated = await Role.findAll({
      where: { id: dupIds },
      include: ["permissions"]
    });

    return populated.map(formatRole);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export default {
  assignRole,
  createRole,
  updateRole,
  deleteRole,
  getRoles,
  bulkDeleteRoles,
  bulkDuplicateRoles
};
