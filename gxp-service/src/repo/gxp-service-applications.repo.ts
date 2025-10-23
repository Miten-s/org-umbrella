import GxpServiceApplicationModel, {
  type IApplication
} from "../models/gxp-service-applications.model";

export const create = async (payload: Partial<IApplication>) => {
  const doc = new GxpServiceApplicationModel(payload);
  return await doc.save();
};

export const findAll = async (filter = {}, projection = null, options = {}) => {
  return await GxpServiceApplicationModel.find(
    filter,
    projection,
    options
  ).lean();
};

export const findById = async (id: string) => {
  return await GxpServiceApplicationModel.findById(id);
};

export const updateById = async (
  id: string,
  updates: Partial<IApplication>
) => {
  return await GxpServiceApplicationModel.findByIdAndUpdate(id, updates, {
    new: true
  });
};

export const softDisable = async (id: string) => {
  return await GxpServiceApplicationModel.findByIdAndUpdate(
    id,
    { status: "disabled" },
    { new: true }
  );
};

export const restore = async (id: string) => {
  return await GxpServiceApplicationModel.findByIdAndUpdate(
    id,
    { status: "enabled" },
    { new: true }
  );
};

export const deleteApplcation = async (id: string) => {
  return await GxpServiceApplicationModel.findByIdAndDelete(id);
};
