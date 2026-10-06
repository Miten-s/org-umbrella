import { Request } from "express";
import { Permission } from "../models/permission.model";
import { Role } from "../models/role.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { publishRbacInvalidation } from "./rbac-invalidation.publisher";
import { recordRbacChange } from "./rbac-audit.service";
import { IUser } from "../models/user.model";

const formatPermission = (perm: any) => {
  if (!perm) return null;
  const json = perm.toJSON ? perm.toJSON() : { ...perm };
  json._id = json.id;
  return json;
};

/** The system-wide and service-scoped full-access sentinels — locked for everyone, Super
 * Admin included, same as their matching roles in role.service.ts's PROTECTED_ROLE_NAMES.
 * A new service's wildcard permission is a new migration, never an edit of an existing one. */
const PROTECTED_PERMISSION_NAMES = new Set([
  "OPERATE:ALL",
  "GXP:OPERATE:ALL",
  "LIMS:OPERATE:ALL"
]);

const assertNotProtectedPermission = (name: string) => {
  if (PROTECTED_PERMISSION_NAMES.has(name)) {
    throw Object.assign(
      new Error(
        `"${name}" is a protected system permission and cannot be modified or deleted.`
      ),
      { statusCode: 403 }
    );
  }
};

const createPermission = async (req: Request) => {
  // Wrapped in a transaction purely so the audit row cannot be lost if it fails: an
  // unlogged permission change is not acceptable in a regulated system.
  const t = await sequelize.transaction();
  try {
    const doc = await Permission.create(req.body, { transaction: t });
    await recordRbacChange(
      {
        actor: req.user as IUser,
        action: "PERMISSION_CREATE",
        targetType: "permission",
        targetId: doc.id,
        targetName: doc.name,
        afterState: { name: doc.name },
        reason: req.body.changeReason ?? null
      },
      t
    );
    await t.commit();
    await publishRbacInvalidation({ scope: "all" });
    return formatPermission(doc);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updatePermission = async (req: Request) => {
  const permission = await Permission.findByPk(req.params.id as string);
  if (!permission) return null;
  assertNotProtectedPermission(permission.name);

  const beforeState = { name: permission.name };
  const t = await sequelize.transaction();
  try {
    await permission.update(req.body, { transaction: t });
    await recordRbacChange(
      {
        actor: req.user as IUser,
        action: "PERMISSION_UPDATE",
        targetType: "permission",
        targetId: permission.id,
        targetName: permission.name,
        beforeState,
        afterState: { name: permission.name },
        reason: req.body.changeReason ?? null
      },
      t
    );
    await t.commit();
    await publishRbacInvalidation({ scope: "all" });
    return formatPermission(permission);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deletePermission = async (req: Request) => {
  const permission = await Permission.findByPk(req.params.id as string);
  if (!permission) return null;
  assertNotProtectedPermission(permission.name);

  const t = await sequelize.transaction();
  try {
    // Soft delete permission
    await permission.destroy({ transaction: t });

    // Remove references from role_permissions
    await sequelize.query(
      `DELETE FROM role_permissions WHERE permission_id = :id`,
      {
        replacements: { id: req.params.id },
        transaction: t
      }
    );

    await recordRbacChange(
      {
        actor: req.user as IUser,
        action: "PERMISSION_DELETE",
        targetType: "permission",
        targetId: permission.id,
        targetName: permission.name,
        beforeState: { name: permission.name },
        reason: (req.body?.changeReason as string) ?? null
      },
      t
    );

    await t.commit();
    await publishRbacInvalidation({ scope: "all" });
    return formatPermission(permission);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const getPermissions = async (options: PaginationOptions, type?: string) => {
  const { page, limit, skip, search } = options;

  const where: any = {
    name: {
      [Op.notILike]: "%OPERATE:ALL%"
    }
  };

  if (type) {
    where.type = type;
  }

  if (search) {
    const searchVal = `%${search}%`;
    where[Op.and] = [
      {
        [Op.or]: [
          { name: { [Op.iLike]: searchVal } },
          { description: { [Op.iLike]: searchVal } }
        ]
      }
    ];
  }

  const { count: totalCount, rows: data } = await Permission.findAndCountAll({
    where,
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });

  return {
    permissions: data.map(formatPermission),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const bulkDeletePermissions = async (ids: string[], actor?: IUser) => {
  const t = await sequelize.transaction();
  try {
    const protectedPermissions = await Permission.findAll({
      where: { id: ids, name: [...PROTECTED_PERMISSION_NAMES] },
      attributes: ["id", "name"],
      transaction: t
    });
    const protectedIds = protectedPermissions.map(
      (permission) => permission.id
    );
    const deletableIds = ids.filter((id) => !protectedIds.includes(id));

    // A batch of ONLY protected permissions must be rejected outright, not silently
    // no-op — an empty `deletableIds` would otherwise reach the raw `IN (:ids)` query
    // below with nothing to interpolate, which is a SQL syntax error, not a clean failure.
    if (deletableIds.length === 0 && ids.length > 0) {
      const names = protectedPermissions.map((p) => `"${p.name}"`).join(", ");
      throw Object.assign(
        new Error(
          `${names} ${protectedPermissions.length > 1 ? "are protected system permissions" : "is a protected system permission"} and cannot be modified or deleted.`
        ),
        { statusCode: 403 }
      );
    }

    // Read before destroying — the audit trail needs what was there.
    const doomed = await Permission.findAll({
      where: { id: deletableIds },
      attributes: ["id", "name"],
      transaction: t
    });

    // Soft delete permissions
    await Permission.destroy({
      where: { id: deletableIds },
      transaction: t
    });

    for (const permission of doomed) {
      await recordRbacChange(
        {
          actor,
          action: "PERMISSION_BULK_DELETE",
          targetType: "permission",
          targetId: permission.id,
          targetName: permission.name,
          beforeState: { name: permission.name }
        },
        t
      );
    }

    if (deletableIds.length > 0) {
      // Cascade: remove deleted permission refs from all role_permissions
      await sequelize.query(
        `DELETE FROM role_permissions WHERE permission_id IN (:ids)`,
        {
          replacements: { ids: deletableIds },
          transaction: t
        }
      );
    }

    await t.commit();
    await publishRbacInvalidation({ scope: "all" });
    return { success: true, message: "Permissions deleted successfully" };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const bulkDuplicatePermissions = async (ids: string[], user?: any) => {
  const t = await sequelize.transaction();
  try {
    const sourcePermissions = await Permission.findAll({
      where: { id: ids },
      transaction: t
    });
    for (const permission of sourcePermissions) {
      assertNotProtectedPermission(permission.name);
    }
    if (!sourcePermissions || sourcePermissions.length === 0) {
      throw new Error("Permissions not found");
    }

    const duplicatedPermissions = [];

    for (const sourcePermission of sourcePermissions) {
      let baseName = sourcePermission.name;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexStr = `^${escapedBaseName}(?:-\\(([0-9]+)\\))?$`;

      const similarPermissionsResult = await Permission.findAll({
        attributes: ["name"],
        where: {
          name: { [Op.iRegexp]: regexStr }
        },
        transaction: t
      });

      let maxIndex = 0;
      similarPermissionsResult.forEach((perm: any) => {
        const match = perm.name.match(new RegExp(regexStr, "i"));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const savedPermission = await Permission.create(
        {
          name: newName,
          description: sourcePermission.description,
          type: sourcePermission.type,
          deletedAt: null,
          modifiedOn: new Date(),
          modifiedBy: user?.id || user?._id
        } as any,
        { transaction: t }
      );

      duplicatedPermissions.push(savedPermission);

      await recordRbacChange(
        {
          actor: user as IUser,
          action: "PERMISSION_BULK_DUPLICATE",
          targetType: "permission",
          targetId: savedPermission.id,
          targetName: savedPermission.name,
          afterState: {
            name: savedPermission.name,
            duplicatedFrom: sourcePermission.id
          }
        },
        t
      );
    }

    await t.commit();
    await publishRbacInvalidation({ scope: "all" });
    return duplicatedPermissions.map(formatPermission);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export default {
  createPermission,
  updatePermission,
  deletePermission,
  getPermissions,
  bulkDeletePermissions,
  bulkDuplicatePermissions
};
