import { Request } from "express";
import { Permission } from "../models/permission.model";

const createPermission = async (req: Request) => {
  return await Permission.create(req.body);
};

const updaetePermission = async (req: Request) => {
  return await Permission.updateOne({ id: req.params.id }, req.body);
};

const deletePermission = async (req: Request) => {
  return await Permission.deleteOne({ id: req.params.id });
};

const getPermissions = async () => {
  return await Permission.find().lean();
};

export default { createPermission, updaetePermission, deletePermission, getPermissions };
