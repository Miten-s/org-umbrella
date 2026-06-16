import { Request } from "express";
import { IUser, User } from "../models/user.model";
import { Role, RoleType } from "../models/role.model";
import { isSuperAdmin } from "../utils/common.util";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

const assignRole = async (req: Request) => {
  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user) return null;
  const role = await Role.findByPk(req.body.role);
  if (role) {
    await (user as any).addRole(role);
  }
  return user;
};

const createRole = async (req: Request) => {
  const { name, permissions, type } = req.body;
  const t = await sequelize.transaction();
  try {
    const role = await Role.create({ name, type }, { transaction: t });
    if (permissions && permissions.length > 0) {
      await (role as any).setPermissions(permissions, { transaction: t });
    }
    await t.commit();
    return role;
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
    await role.update({ name, type }, { transaction: t });
    if (permissions !== undefined) {
      await (role as any).setPermissions(permissions, { transaction: t });
    }
    await t.commit();
    return role;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteRole = async (req: Request) => {
  const t = await sequelize.transaction();
  try {
    const role = await Role.findByPk(req.params.id as string);
    if (!role) return null;
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
    return role;
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
  if (type) {
    where = { type };
  } else if (isSuperAdmin(user)) {
    where = {
      type: { [Op.in]: [RoleType.CUSTOM, RoleType.BUILT_IN, RoleType.GXP_SERVICE] }
    };
  }

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  const { count: totalCount, rows: data } = await Role.findAndCountAll({
    where,
    offset: skip,
    limit,
    include: ["permissions"],
    order: [["created_at", "DESC"]]
  });

  return {
    roles: data,
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
    await Role.destroy({
      where: { id: ids },
      transaction: t
    });

    // Cascade: remove deleted role refs from all user_roles
    await sequelize.query(
      `DELETE FROM user_roles WHERE role_id IN (:ids)`,
      {
        replacements: { ids },
        transaction: t
      }
    );

    // Cascade: remove deleted role refs from all role_permissions
    await sequelize.query(
      `DELETE FROM role_permissions WHERE role_id IN (:ids)`,
      {
        replacements: { ids },
        transaction: t
      }
    );

    await t.commit();
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
        where: {
          name: { [Op.iRegexp]: regexStr }
        },
        transaction: t
      });

      let maxIndex = 0;
      similarRolesResult.forEach((role: any) => {
        const match = role.name.match(new RegExp(regexStr, 'i'));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const savedRole = await Role.create({
        name: newName,
        type: RoleType.CUSTOM,
        deletedAt: null
      } as any, { transaction: t });

      if (sourceRole.permissions && sourceRole.permissions.length > 0) {
        const permIds = sourceRole.permissions.map((p: any) => p.id);
        await (savedRole as any).setPermissions(permIds, { transaction: t });
      }

      duplicatedRoles.push(savedRole);
    }

    await t.commit();
    return duplicatedRoles;
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
