import { Request } from "express";
import { IUser, User } from "../models/user.model";

const getUsers = async (user?: IUser) => {
  let filter: {} = { username: { $nin: ["superadmin", user?.username] } };
  return await User.find(filter).populate("roles", ["name"]);
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
    { $set: { deletedAt: new Date() } }
  );
};

const getUserDetail = async (id: string) => {
  return await User.findOne(
    { _id: id },
    { password: 0, "roles.name": 0 },
    { populate: { path: "roles", select: ["permissions"] } }
  ).exec();
};

export default { getUsers, createUser, updateUser, deleteUser, getUserDetail };
