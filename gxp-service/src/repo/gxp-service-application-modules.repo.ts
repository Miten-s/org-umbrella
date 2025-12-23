import {
  GxpServiceAppModuleModel,
  type IGxpServiceAppModule
} from "../models/gxp-service-application-modules.model";

export const createApplicationModule = async (
  payload: Partial<IGxpServiceAppModule>,
  currentUser: string
) => {
  const doc = new GxpServiceAppModuleModel({
    ...payload,
    createdBy: currentUser
  });
  return await doc.save();
};

export const getApplicationModules = async (
  filter = {},
  projection = null,
  options = {}
) => {
  return await GxpServiceAppModuleModel.find(
    filter,
    projection,
    options
  ).lean();
};

export const findApplicationModulesById = async (id: string) => {
  return await GxpServiceAppModuleModel.findById(id);
};

export const updateApplicationModule = async (
  id: string,
  updates: Partial<IGxpServiceAppModule>
) => {
  return await GxpServiceAppModuleModel.findByIdAndUpdate(id, updates, {
    new: true
  });
};

export const deleteApplcationModule = async (id: string) => {
  return await GxpServiceAppModuleModel.findByIdAndDelete(id);
};
