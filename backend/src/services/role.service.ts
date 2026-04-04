import { Request } from "express";
import { IUser, User } from "../models/user.model";
import { Role, RoleType } from "../models/role.model";
import { isSuperAdmin } from "../utils/common.util";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

const assignRole = async (req: Request) => {
  return await User.findOneAndUpdate(
    { email: req.body.email },
    { $push: { roles: req.body.role } },
    { new: true }
  );
};

const createRole = async (req: Request) => {
  const { name, permissions, type } = req.body;
  return await Role.create({
    name,
    permissions,
    type
  });
};

const updateRole = async (req: Request) => {
  return await Role.updateOne(
    { _id: req.params.id },
    { $set: { ...req.body } }
  );
};

const deleteRole = async (req: Request) => {
  return await Role.updateOne(
    { _id: req.params.id },
    { $set: { deletedAt: new Date() } }
  );
};


const getRoles = async (options: PaginationOptions, user?: IUser, type?: string) => {
  const { page, limit, skip, search } = options;
  let filter: any = { type: RoleType.CUSTOM };
  if (type) {
    filter = { type };
  } else if (isSuperAdmin(user)) {
    filter = { type: { $in: [RoleType.CUSTOM, RoleType.BUILT_IN, RoleType.GXP_SERVICE] } };
  }

  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: "i" };
  }

  const [data, totalCount] = await Promise.all([
    Role.find(filter).skip(skip).limit(limit).lean(),
    Role.countDocuments(filter).exec()
  ]);

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

export default { assignRole, createRole, updateRole, deleteRole, getRoles };
