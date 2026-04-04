import { Request } from "express";
import { Permission } from "../models/permission.model";
import { ObjectId } from "mongodb";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

const createPermission = async (req: Request) => {
  return await Permission.create(req.body);
};

const updatePermission = async (req: Request) => {
  return await Permission.updateOne({ id: req.params.id }, req.body);
};

const deletePermission = async (req: Request) => {
  return await Permission.updateOne(
    { _id: new ObjectId(req.params.id as string) },
    { $set: { deletedAt: new Date() } }
  );
};


const getPermissions = async (options: PaginationOptions, type?: string) => {
  const { page, limit, skip, search } = options;
  const filter: any = {
    type,
    deletedAt: { $not: null },
    name: { $not: /OPERATE:ALL/i }
  };

  if (search) {
    const sanitizedSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    ];
  }

  const [data, totalCount] = await Promise.all([
    Permission.find(filter).skip(skip).limit(limit).lean(),
    Permission.countDocuments(filter).exec()
  ]);

  return {
    permissions: data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export default {
  createPermission,
  updatePermission,
  deletePermission,
  getPermissions
};
