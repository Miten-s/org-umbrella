import { Designation } from "../models/designation.model";

interface IDesignation {
  designation_name: string;
  description?: string;
}

const createDesignation = async (data: IDesignation) => {
  const newDesignation = new Designation(data);
  return await newDesignation.save();
};

const getAllDesignations = async () => {
  return await Designation.find().exec();
};

const getDesignationByName = async (name: string) => {
  return await Designation.findOne({ designation_name: name }).exec();
};

const updateDesignation = async (name: string, data: Partial<IDesignation>) => {
  return await Designation.findOneAndUpdate({ designation_name: name }, data, {
    new: true
  }).exec();
};

const disableDesignation = async (name: string) => {
  return await Designation.findOneAndUpdate(
    { designation_name: name },
    { status: "disabled" },
    { new: true }
  ).exec();
};

const enableDesignation = async (name: string) => {
  return await Designation.findOneAndUpdate(
    { designation_name: name },
    { status: "active" },
    { new: true }
  ).exec();
};

export {
  createDesignation,
  getAllDesignations,
  getDesignationByName,
  updateDesignation,
  disableDesignation,
  enableDesignation
};
