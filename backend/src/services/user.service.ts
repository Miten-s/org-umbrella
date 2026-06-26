import { Request } from "express";
import { IUser, User } from "../models/user.model";
import { Role, RoleType } from "../models/role.model";
import { Permission } from "../models/permission.model";
import { Department } from "../models/department.model";
import { Location } from "../models/location.model";
import { Designation } from "../models/designation.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

const formatUser = (user: any) => {
  if (!user) return null;
  const json = user.toJSON ? user.toJSON() : { ...user };
  json._id = json.id;
  
  if (json.roles) {
    json.roles = json.roles.map((r: any) => ({
      _id: r.id,
      id: r.id,
      name: r.name,
      type: r.type,
      permissions: r.permissions ? r.permissions.map((p: any) => ({
        _id: p.id,
        id: p.id,
        name: p.name
      })) : []
    }));
  }
  if (json.department) {
    json.department = {
      _id: json.department.id,
      id: json.department.id,
      departmentName: json.department.departmentName
    };
  }
  if (json.location) {
    json.location = {
      _id: json.location.id,
      id: json.location.id,
      locationName: json.location.locationName
    };
  }
  if (json.designation) {
    json.designation = {
      _id: json.designation.id,
      id: json.designation.id,
      designationName: json.designation.designationName
    };
  }
  return json;
};

const assignDefaultRole = async (payload: Record<string, any>) => {
  if (!payload.userType) return payload;

  const defaultRole = await Role.findOne({
    where: {
      name: payload.userType,
      type: RoleType.BUILT_IN
    }
  });

  if (!defaultRole) return payload;

  const existingRoles = Array.isArray(payload.roles) ? payload.roles : [];
  const roleIds = new Set([
    defaultRole.id,
    ...existingRoles.map((roleId: any) => roleId.toString())
  ]);

  payload.roles = Array.from(roleIds);
  return payload;
};

const getUsers = async (options: PaginationOptions, user?: IUser) => {
  const { page, limit, skip, search } = options;
  const where: any = {
    fullName: {
      [Op.notIn]: ["superadmin", user?.fullName || ""]
    }
  };

  if (search) {
    const searchVal = `%${search}%`;
    where[Op.and] = [
      {
        [Op.or]: [
          { fullName: { [Op.iLike]: searchVal } },
          { email: { [Op.iLike]: searchVal } },
          { name: { [Op.iLike]: searchVal } }
        ]
      }
    ];
  }

  const { count: totalCount, rows: data } = await User.findAndCountAll({
    where,
    offset: skip,
    limit,
    include: [
      { model: Role, as: "roles", attributes: ["id", "name", "type"], include: [{ model: Permission, as: "permissions", attributes: ["id", "name"] }] },
      { model: Department, as: "department", attributes: ["id", "departmentName"] },
      { model: Location, as: "location", attributes: ["id", "locationName"] },
      { model: Designation, as: "designation", attributes: ["id", "designationName"] }
    ],
    order: [["created_at", "DESC"]]
  });

  return {
    users: data.map(formatUser),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const createUser = async (req: Request) => {
  const payload = typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
  const signature = req.file?.filename;
  payload["createdBy"] = (req?.user as any)?.id || (req?.user as any)?._id;

  if (signature) {
    payload["signature"] = signature;
  }
  await assignDefaultRole(payload);

  const roles = payload.roles;
  delete payload.roles;

  if (payload.department) {
    payload.departmentId = payload.department;
    delete payload.department;
  }
  if (payload.location) {
    payload.locationId = Array.isArray(payload.location) ? payload.location[0] : payload.location;
    delete payload.location;
  }
  if (payload.designation) {
    payload.designationId = payload.designation;
    delete payload.designation;
  }
  if (payload.manager) {
    payload.managerId = payload.manager;
    delete payload.manager;
  }

  const t = await sequelize.transaction();
  try {
    const user = await User.create(payload, { transaction: t });
    if (roles && roles.length > 0) {
      await (user as any).setRoles(roles, { transaction: t });
    }
    await t.commit();
    
    const fetched = await User.findByPk(user.id, {
      include: [
        { model: Role, as: "roles", attributes: ["id", "name", "type"], include: [{ model: Permission, as: "permissions", attributes: ["id", "name"] }] },
        { model: Department, as: "department", attributes: ["id", "departmentName"] },
        { model: Location, as: "location", attributes: ["id", "locationName"] },
        { model: Designation, as: "designation", attributes: ["id", "designationName"] }
      ]
    });
    return formatUser(fetched);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updateUser = async (req: Request) => {
  const payload = typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
  const signature = req.file?.filename;
  if (signature) {
    payload["signature"] = signature;
  }

  payload["modifiedBy"] = (req?.user as any)?.id || (req?.user as any)?._id;
  payload["modifiedOn"] = new Date();

  const roles = payload.roles;
  delete payload.roles;

  if (payload.department !== undefined) {
    payload.departmentId = payload.department;
    delete payload.department;
  }
  if (payload.location !== undefined) {
    payload.locationId = Array.isArray(payload.location) ? payload.location[0] : payload.location;
    delete payload.location;
  }
  if (payload.designation !== undefined) {
    payload.designationId = payload.designation;
    delete payload.designation;
  }
  if (payload.manager !== undefined) {
    payload.managerId = payload.manager;
    delete payload.manager;
  }

  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id as string);
    if (!user) throw new Error("User not found");
    await user.update(payload, { transaction: t });
    if (roles !== undefined) {
      await (user as any).setRoles(roles, { transaction: t });
    }
    await t.commit();
    return { success: true };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteUser = async (req: Request) => {
  const user = await User.findByPk(req.params.id as string);
  if (!user) return null;
  await user.destroy();
  return formatUser(user);
};

const getUserDetail = async (id: string) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
    include: [
      { model: Role, as: "roles", attributes: ["id", "name", "type"], include: [{ model: Permission, as: "permissions", attributes: ["id", "name"] }] },
      { model: Department, as: "department", attributes: ["id", "departmentName"] },
      { model: Location, as: "location", attributes: ["id", "locationName"] },
      { model: Designation, as: "designation", attributes: ["id", "designationName"] }
    ]
  });
  return formatUser(user);
};

const bulkDeleteUsers = async (ids: string[], requestingUserId?: string) => {
  const where: any = {
    id: ids,
    fullName: { [Op.ne]: "superadmin" }
  };
  if (requestingUserId) {
    where.id = { [Op.in]: ids, [Op.ne]: requestingUserId };
  }
  return await User.destroy({ where });
};

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserDetail,
  bulkDeleteUsers
};
