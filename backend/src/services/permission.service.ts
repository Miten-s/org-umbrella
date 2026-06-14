import { Request } from "express";
import mongoose from "mongoose";
import { Permission } from "../models/permission.model";
import { Role } from "../models/role.model";
import { ObjectId } from "mongodb";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

const createPermission = async (req: Request) => {
  return await Permission.create(req.body);
};

const updatePermission = async (req: Request) => {
  return await Permission.updateOne(
    { _id: new ObjectId(req.params.id as string) },
    req.body
  );
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

const bulkDeletePermissions = async (ids: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await Permission.updateMany(
      { _id: { $in: ids }, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { session }
    );

    // Cascade: remove deleted permission refs from all Roles
    await Role.updateMany(
      { permissions: { $in: ids } },
      { $pull: { permissions: { $in: ids } } },
      { session }
    );

    await session.commitTransaction();
    return { success: true, message: "Permissions deleted successfully" };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};

const bulkDuplicatePermissions = async (ids: string[], user?: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const sourcePermissions = await Permission.find({
      _id: { $in: ids }
    }).session(session);
    if (!sourcePermissions || sourcePermissions.length === 0) {
      throw new Error("Permissions not found");
    }

    const duplicatedPermissions = [];

    for (const sourcePermission of sourcePermissions) {
      let baseName = sourcePermission.name;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

      const similarPermissionsResult = await Permission.find({
        name: { $regex: regex }
      }).session(session);

      let maxIndex = 0;
      similarPermissionsResult.forEach((perm: any) => {
        const match = perm.name.match(regex);
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const toSave = new Permission({
        name: newName,
        description: sourcePermission.description,
        type: sourcePermission.type,
        deletedAt: null,
        modifiedOn: new Date(),
        modifiedBy: user?._id
      });

      const savedPermission = await toSave.save({ session });
      duplicatedPermissions.push(savedPermission);
    }

    await session.commitTransaction();
    return duplicatedPermissions;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export default {
  createPermission,
  updatePermission,
  deletePermission,
  getPermissions,
  bulkDeletePermissions,
  bulkDuplicatePermissions
};
