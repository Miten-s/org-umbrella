import { Department, IDepartment } from "../models/department.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

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

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
