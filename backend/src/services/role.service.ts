import { Request } from "express";
import { IUser, User } from "../models/user.model";
import { Role, RoleType } from "../models/role.model";
import { Permission } from "../models/permission.model";
import { isSuperAdmin, getUserPermissionNames } from "../utils/common.util";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { publishRbacInvalidation } from "./rbac-invalidation.publisher";
import { recordRbacChange, permissionNamesOf } from "./rbac-audit.service";

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
    return [
      RoleType.CUSTOM,
      RoleType.BUILT_IN,
      RoleType.GXP_SERVICE,
      RoleType.LIMS_SERVICE
    ];
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
  if (
    names.has("LIMS:CREATE:ROLE") ||
    names.has("LIMS:UPDATE:ROLE") ||
    names.has("LIMS:DELETE:ROLE") ||
    names.has("LIMS:VIEW:ROLE")
  ) {
    types.push(RoleType.LIMS_SERVICE);
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
 * (see backend/src/migrations/018-seed-gxp-master-admin-role.ts) and LIMS Master Admin is
 * the LIMS one (022-seed-lims-master-admin-role.ts). lims-service also protects its own,
 * separately-stored copy inside role.routes.ts until its cutover. */
const PROTECTED_ROLE_NAMES = new Set([
  "Super Admin",
  "GXP Master Admin",
  "LIMS Master Admin"
]);

/** Lims_Service roles are mirrored from LIMS (see lims-role-sync.service.ts): lims-service
 * is the only writer. Editing one here would be overwritten by the next sync, and LIMS's own
 * screens would not show the change — so the public API refuses, for everyone. */
const assertNotLimsManaged = (type: RoleType | string | undefined) => {
  if (type === RoleType.LIMS_SERVICE) {
    throw Object.assign(
      new Error(
        "LIMS roles are managed from the LIMS Roles screen and cannot be changed here."
      ),
      { statusCode: 403 }
    );
  }
};

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
    const t = await sequelize.transaction();
    try {
      await (user as any).addRole(role, { transaction: t });
      await recordRbacChange(
        {
          actor: req.user as IUser,
          action: "ROLE_ASSIGN",
          targetType: "user_role",
          targetId: user.id,
          targetName: user.email,
          afterState: { roleId: role.id, roleName: role.name },
          reason: req.body.changeReason ?? null
        },
        t
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
    await publishRbacInvalidation({ scope: "user", platformUserId: user.id });
  }
  return user;
};

const createRole = async (req: Request) => {
  const { name, permissions, type } = req.body;
  assertNotLimsManaged(type);
  assertRoleTypeAuthority(req.user as IUser, type ?? RoleType.CUSTOM);
  await assertNoEscalation(req.user as IUser, permissions);
  const t = await sequelize.transaction();
  try {
    const role = await Role.create({ name, type }, { transaction: t });
    if (permissions && permissions.length > 0) {
      await (role as any).setPermissions(permissions, { transaction: t });
    }
    await recordRbacChange(
      {
        actor: req.user as IUser,
        action: "ROLE_CREATE",
        targetType: "role",
        targetId: role.id,
        targetName: name,
        afterState: {
          name,
          type: type ?? RoleType.CUSTOM,
          permissions: permissionNamesOf(permissions)
        },
        reason: req.body.changeReason ?? null
      },
      t
    );
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
    const role = await Role.findByPk(req.params.id as string, {
      include: ["permissions"],
      transaction: t
    });
    if (!role) throw new Error("Role not found");
    const beforeState = {
      name: role.name,
      type: role.type,
      permissions: permissionNamesOf((role as any).permissions)
    };
    assertNotProtectedRole(role.name);
    assertNotLimsManaged(role.type);
    assertNotLimsManaged(type);
    assertRoleTypeAuthority(req.user as IUser, role.type);
    if (type && type !== role.type) {
      assertRoleTypeAuthority(req.user as IUser, type);
    }
    await assertNoEscalation(req.user as IUser, permissions);
    await role.update({ name, type }, { transaction: t });
    if (permissions !== undefined) {
      await (role as any).setPermissions(permissions, { transaction: t });
    }
    await recordRbacChange(
      {
        actor: req.user as IUser,
        action: "ROLE_UPDATE",
        targetType: "role",
        targetId: role.id,
        targetName: name ?? role.name,
        beforeState,
        afterState: {
          name: name ?? role.name,
          type: type ?? role.type,
          permissions:
            permissions === undefined
              ? beforeState.permissions
              : permissionNamesOf(permissions)
        },
        reason: req.body.changeReason ?? null
      },
      t
    );
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
    assertNotLimsManaged(role.type);
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

    await recordRbacChange(
      {
        actor: req.user as IUser,
        action: "ROLE_DELETE",
        targetType: "role",
        targetId: role.id,
        targetName: role.name,
        beforeState: {
          name: role.name,
          type: role.type,
          permissions: permissionNamesOf((role as any).permissions)
        },
        reason: (req.body?.changeReason as string) ?? null
      },
      t
    );

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
  const permissionNames = getUserPermissionNames(user);
  const canManageGxpRoles =
    isSuperAdmin(user) || permissionNames.includes("GXP:CREATE:ROLE");
  const canManageLimsRoles =
    isSuperAdmin(user) || permissionNames.includes("LIMS:CREATE:ROLE");

  if (type) {
    where = { type };
  } else if (isSuperAdmin(user)) {
    where = {
      type: {
        [Op.in]: [
          RoleType.CUSTOM,
          RoleType.BUILT_IN,
          RoleType.GXP_SERVICE,
          RoleType.LIMS_SERVICE
        ]
      }
    };
  } else if (canManageGxpRoles || canManageLimsRoles) {
    // A service-side admin manages their own service's roles here too — reusing the
    // platform's Role/Permission tables rather than a second, service-local role screen.
    where = {
      type: {
        [Op.in]: [
          RoleType.CUSTOM,
          ...(canManageGxpRoles ? [RoleType.GXP_SERVICE] : []),
          ...(canManageLimsRoles ? [RoleType.LIMS_SERVICE] : [])
        ]
      }
    };
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

const bulkDeleteRoles = async (ids: string[], actor?: IUser) => {
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

    // Read before destroying — the audit trail needs what was there.
    const doomedRoles = await Role.findAll({
      where: { id: deletableIds },
      include: ["permissions"],
      transaction: t
    });
    for (const role of doomedRoles) assertNotLimsManaged(role.type);

    await Role.destroy({
      where: { id: deletableIds },
      transaction: t
    });

    for (const role of doomedRoles) {
      await recordRbacChange(
        {
          actor,
          action: "ROLE_BULK_DELETE",
          targetType: "role",
          targetId: role.id,
          targetName: role.name,
          beforeState: {
            name: role.name,
            type: role.type,
            permissions: permissionNamesOf((role as any).permissions)
          }
        },
        t
      );
    }

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

const bulkDuplicateRoles = async (ids: string[], actor?: IUser) => {
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
    for (const role of sourceRoles) {
      assertNotProtectedRole(role.name);
      assertNotLimsManaged(role.type);
    }

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

      await recordRbacChange(
        {
          actor,
          action: "ROLE_BULK_DUPLICATE",
          targetType: "role",
          targetId: savedRole.id,
          targetName: savedRole.name,
          afterState: {
            name: savedRole.name,
            type: savedRole.type,
            duplicatedFrom: sourceRole.id
          }
        },
        t
      );
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
