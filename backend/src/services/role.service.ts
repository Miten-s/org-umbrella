import { Request } from "express";
import { User } from "../models/user.model";
import { Role } from "../models/role.model";

const assignRole = async (req: Request) => {
  // Attempt to find a user by their email and update their roles by adding a new role
  return await User.findOneAndUpdate(
    { email: req.body.email },
    { $push: { roles: req.body.role } }, // Update operation: push a new role to the user's roles array
    { new: true }
  );
};

const createRole = async (req: Request) => {
  return await Role.create(req.body);
};

const updaeteRole = async (req: Request) => {
  return await Role.updateOne({ id: req.params.id }, req.body);
};

const deleteRole = async (req: Request) => {
  return await Role.deleteOne({ id: req.params.id });
};

const getRoles = async () => {
  return await Role.find().lean();
};

export default { assignRole, createRole, updaeteRole, deleteRole, getRoles };
