import { Designation } from "../models/designation.model";

interface IDesignation {
  designationName: string;
  description?: string;
}

const createDesignation = async (data: IDesignation) => {
  const newDesignation = new Designation(data);
  return await newDesignation.save();
};

const getAllDesignations = async () => {
  return await Designation.find().exec();
};

const getDesignationById = async (_id: string) => {
  return await Designation.findOne({ _id }).exec();
};

const updateDesignation = async (_id: string, data: Partial<IDesignation>) => {
  return await Designation.findOneAndUpdate({ _id }, data, {
    new: true
  }).exec();
};

const deleteDesignation = async (_id: string) => {
  return await Designation.findOneAndUpdate(
    { _id },
    { deletedAt: new Date() }
  ).exec();
};

export {
  createDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation
};
