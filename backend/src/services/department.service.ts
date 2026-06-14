import { Department, IDepartment } from "../models/department.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";
import mongoose from "mongoose";

const createDepartment = async (data: IDepartment, user: any) => {
  const newDepartment = new Department({
    ...data,
    createdOn: new Date(),
    createdBy: user,
    modifiedOn: new Date(),
    modifiedBy: user
  });
  return await newDepartment.save();
};

const getAllDepartments = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const filter: any = {};

  if (search) {
    const sanitizedSearch = escapeRegex(search);
    filter.$or = [
      { departmentName: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    ];
  }

  const [data, totalCount] = await Promise.all([
    Department.find(filter)
      .populate("departmentManager", "_id name")
      .skip(skip)
      .limit(limit)
      .exec(),
    Department.countDocuments(filter).exec()
  ]);

  return {
    departments: data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const getDepartmentById = async (id: string) => {
  return await Department.findById(id)
    .populate("departmentManager", "_id name")
    .exec();
};

const updateDepartment = async (
  _id: string,
  data: Partial<IDepartment>,
  user: any
) => {
  return await Department.findOneAndUpdate(
    { _id },
    {
      $set: {
        ...data,
        createdBy: user,
        modifiedOn: new Date(),
        modifiedBy: user
      }
    },
    { new: true }
  );
};

const deleteDepartment = async (id: string) => {
  return await Department.findOneAndUpdate(
    { _id: id },
    { deletedAt: new Date() }
  ).exec();
};

const bulkDeleteDepartments = async (ids: string[]) => {
  return await Department.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );
};

const bulkDuplicateDepartments = async (ids: string[], user?: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const sourceDepartments = await Department.find({
      _id: { $in: ids }
    }).session(session);
    if (!sourceDepartments || sourceDepartments.length === 0) {
      throw new Error("Departments not found");
    }

    const duplicatedDepartments = [];

    for (const sourceDepartment of sourceDepartments) {
      let baseName = sourceDepartment.departmentName;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

      const similarDepartmentsResult = await Department.find({
        departmentName: { $regex: regex }
      }).session(session);

      let maxIndex = 0;
      similarDepartmentsResult.forEach((dept: any) => {
        const match = dept.departmentName.match(regex);
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const toSave = new Department({
        departmentName: newName,
        departmentManager: sourceDepartment.departmentManager,
        departmentGroupLocation: sourceDepartment.departmentGroupLocation,
        description: sourceDepartment.description,
        status: sourceDepartment.status,
        deletedAt: null,
        createdOn: new Date(),
        createdBy: user?._id,
        modifiedOn: new Date(),
        modifiedBy: user?._id
      });

      const savedDepartment = await toSave.save({ session });
      duplicatedDepartments.push(savedDepartment);
    }

    await session.commitTransaction();
    return duplicatedDepartments;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  bulkDeleteDepartments,
  bulkDuplicateDepartments
};
