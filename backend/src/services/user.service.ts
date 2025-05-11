import { Request } from "express";
import { User } from "../models/user.model";

const getUsers = async () => {
  return await User.find().populate("roles", ["name"]);
};

const createUser = async (req: Request) => {
  return await User.create(req.body);
};

const updateUser = async (req: Request) => {
  return await User.updateOne({ _id: req.params.id }, req.body);
};

const deleteUser = async (req: Request) => {
  return await User.updateOne(
    { _id: req.params.id },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
};

export default { getUsers, createUser, updateUser, deleteUser };
