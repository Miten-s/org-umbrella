import {
  ApplicationModel,
  IApplication
} from "../models/gxp-service-applications.model";

export const create = async (payload: Partial<IApplication>) => {
  const doc = new ApplicationModel(payload);
  return await doc.save();
};

export const findAll = async (filter = {}, projection = null, options = {}) => {
  return await ApplicationModel.find(filter, projection, options).lean();
};

export const findById = async (id: string) => {
  return await ApplicationModel.findById(id);
};

export const updateById = async (
  id: string,
  updates: Partial<IApplication>
) => {
  return await ApplicationModel.findByIdAndUpdate(id, updates, { new: true });
};

export const softDisable = async (id: string) => {
  return await ApplicationModel.findByIdAndUpdate(
    id,
    { status: "disabled" },
    { new: true }
  );
};

export const restore = async (id: string) => {
  return await ApplicationModel.findByIdAndUpdate(
    id,
    { status: "enabled" },
    { new: true }
  );
};
