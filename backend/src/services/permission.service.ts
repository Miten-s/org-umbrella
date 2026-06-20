import { Request } from "express";
import { Permission } from "../models/permission.model";
import { Role } from "../models/role.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

const createPermission = async (req: Request) => {
  return await Permission.create(req.body);
};

const updatePermission = async (req: Request) => {
  const permission = await Permission.findByPk(req.params.id as string);
  if (!permission) return null;
  return await permission.update(req.body);
};

const deletePermission = async (req: Request) => {
  const permission = await Permission.findByPk(req.params.id as string);
  if (!permission) return null;
  
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

    await t.commit();
    return permission;
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
    permissions: data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const bulkDeletePermissions = async (ids: string[]) => {
  const t = await sequelize.transaction();
  try {
    // Soft delete permissions
    await Permission.destroy({
      where: { id: ids },
      transaction: t
    });

    // Cascade: remove deleted permission refs from all role_permissions
    await sequelize.query(
      `DELETE FROM role_permissions WHERE permission_id IN (:ids)`,
      {
        replacements: { ids },
        transaction: t
      }
    );

    await t.commit();
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
        where: {
          name: { [Op.iRegexp]: regexStr }
        },
        transaction: t
      });

      let maxIndex = 0;
      similarPermissionsResult.forEach((perm: any) => {
        const match = perm.name.match(new RegExp(regexStr, 'i'));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const savedPermission = await Permission.create({
        name: newName,
        description: sourcePermission.description,
        type: sourcePermission.type,
        deletedAt: null,
        modifiedOn: new Date(),
        modifiedBy: user?.id || user?._id
      } as any, { transaction: t });

      duplicatedPermissions.push(savedPermission);
    }

    await t.commit();
    return duplicatedPermissions;
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
