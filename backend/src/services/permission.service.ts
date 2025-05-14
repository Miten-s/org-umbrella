import { Request } from "express";
import { Permission } from "../models/permission.model";
import { ObjectId } from "mongodb";

const createPermission = async (req: Request) => {
  return await Permission.create(req.body);
};

const updatePermission = async (req: Request) => {
  return await Permission.updateOne({ id: req.params.id }, req.body);
};

const deletePermission = async (req: Request) => {
  return await Permission.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
};

const getPermissions = async () => {
  return await Permission.find({ isDeleted: false , name : { $not: /OPERATE:ALL/i } }).lean();
};

export default {
  createPermission,
  updatePermission,
  deletePermission,
  getPermissions,
};
