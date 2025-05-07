import { Request } from "express";
import { User } from "../models/user.model";
import { Role } from "../models/role.model";

const assignRole = async (req: Request) => {
  // Attempt to find a user by their email and update their roles by adding a new role
  return await User.findOneAndUpdate(
    { email: req.body.email },
    { $push: { roles: req.body.role } },
    { new: true }
  );
};

const createRole = async (req: Request) => {
  const { name, permissions, organization } = req.body;
  return await Role.create({ name, permissions, organization });
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
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
};

const getRoles = async () => {
  return await Role.find().lean();
};

export default { assignRole, createRole, updateRole, deleteRole, getRoles };
