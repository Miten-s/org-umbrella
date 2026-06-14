import { Request } from "express";
import mongoose from "mongoose";
import { IUser, User } from "../models/user.model";
import { Role, RoleType } from "../models/role.model";
import { isSuperAdmin } from "../utils/common.util";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

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

const getRoles = async (
  options: PaginationOptions,
  user?: IUser,
  type?: string
) => {
  const { page, limit, skip, search } = options;
  let filter: any = { type: RoleType.CUSTOM };
  if (type) {
    filter = { type };
  } else if (isSuperAdmin(user)) {
    filter = {
      type: { $in: [RoleType.CUSTOM, RoleType.BUILT_IN, RoleType.GXP_SERVICE] }
    };
  }

  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: "i" };
  }

  const [data, totalCount] = await Promise.all([
    Role.find(filter).skip(skip).limit(limit).lean(),
    Role.countDocuments(filter).exec()
  ]);

  return {
    roles: data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const bulkDeleteRoles = async (ids: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await Role.updateMany(
      { _id: { $in: ids }, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { session }
    );

    // Cascade: remove deleted role refs from all Users
    await User.updateMany(
      { roles: { $in: ids } },
      { $pull: { roles: { $in: ids } } },
      { session }
    );

    await session.commitTransaction();
    return { success: true, message: "Roles deleted successfully" };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};

const bulkDuplicateRoles = async (ids: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const sourceRoles = await Role.find({ _id: { $in: ids } }).session(session);
    if (!sourceRoles || sourceRoles.length === 0) {
      throw new Error("Roles not found");
    }

    const duplicatedRoles = [];

    for (const sourceRole of sourceRoles) {
      let baseName = sourceRole.name;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

      const similarRolesResult = await Role.find({
        name: { $regex: regex }
      }).session(session);

      let maxIndex = 0;
      similarRolesResult.forEach((role: any) => {
        const match = role.name.match(regex);
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const toSave = new Role({
        name: newName,
        permissions: sourceRole.permissions,
        type: RoleType.CUSTOM,
        deletedAt: null
      });

      const savedRole = await toSave.save({ session });
      duplicatedRoles.push(savedRole);
    }

    await session.commitTransaction();
    return duplicatedRoles;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export default {
  assignRole,
  createRole,
  updateRole,
  deleteRole,
  getRoles,
  bulkDeleteRoles,
  bulkDuplicateRoles
};
