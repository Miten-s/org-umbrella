import { Department, IDepartment } from "../models/department.model";

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

const getAllDepartments = async () => {
  return await Department.find()
    .populate("departmentManager", "_id name")
    .exec();
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
