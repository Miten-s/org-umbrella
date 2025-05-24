import { Department, IDepartment } from "../models/department.model";

const createDepartment = async (data: IDepartment, user: any) => {
  const newDepartment = new Department({
    ...data,
    created_on: new Date(),
    created_by: user,
    modified_on: new Date(),
    modified_by: user
  });
  return await newDepartment.save();
};

const getAllDepartments = async () => {
  return await Department.find()
    .populate("department_manager", "user_id name")
    .exec();
};

const getDepartmentById = async (id: string) => {
  return await Department.findById(id)
    .populate("department_manager", "user_id name")
    .exec();
};

const updateDepartment = async (
  id: string,
  data: Partial<IDepartment>,
  user: any
) => {
  return await Department.findByIdAndUpdate(
    id,
    { ...data, modified_on: new Date(), modified_by: user },
    { new: true }
  );
};

const deleteDepartment = async (id: string) => {
  return await Department.findByIdAndDelete(id);
};

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
