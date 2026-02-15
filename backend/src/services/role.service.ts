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

const getRoles = async (user?: IUser, type?: string) => {
  let filter: {} = { type: RoleType.CUSTOM };
  if (type) {
    filter = { type };
  } else if (isSuperAdmin(user)) {
    filter = { type: { $in: [RoleType.CUSTOM, RoleType.BUILT_IN, RoleType.GXP_SERVICE] } };
  }

  return await Role.find(filter).lean();
};

export default { assignRole, createRole, updateRole, deleteRole, getRoles };
