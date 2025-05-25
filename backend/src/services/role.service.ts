import { Request } from "express";
import { IUser, User } from "../models/user.model";
import { Role, RoleType } from "../models/role.model";
import { isSuperAdmin } from "../utils/common.util";

const assignRole = async (req: Request) => {
  return await User.findOneAndUpdate(
    { email: req.body.email },
    { $push: { roles: req.body.role } },
    { new: true }
  );
};

const createRole = async (req: Request) => {
  const { name, permissions } = req.body;
  return await Role.create({
    name,
    permissions,
    type: RoleType.CUSTOM
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

const getRoles = async (user?: IUser) => {
  let filter: {} = { type: RoleType.CUSTOM };

  if (isSuperAdmin(user)) {
    filter = { type: { $in: [RoleType.CUSTOM, RoleType.BUILT_IN] } };
  }

  return await Role.find(filter).lean();
};

export default { assignRole, createRole, updateRole, deleteRole, getRoles };
