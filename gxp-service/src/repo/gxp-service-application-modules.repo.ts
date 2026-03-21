import {
  GxpServiceAppModuleModel,
  type IGxpServiceAppModule
} from "../models/gxp-service-application-modules.model";

const moduleApplicationPopulate = {
  path: "application",
  select: "applicationName"
} as const;

export const createApplicationModule = async (
  payload: Partial<IGxpServiceAppModule>,
  currentUser: string
) => {
  const doc = new GxpServiceAppModuleModel({
    ...payload,
    createdBy: currentUser
  });
  const saved = await doc.save();
  return await saved.populate(moduleApplicationPopulate);
};

export const getApplicationModules = async (
  filter = {},
  projection = null,
  options = {}
) => {
  return await GxpServiceAppModuleModel.find(filter, projection, options)
    .populate(moduleApplicationPopulate)
    .lean();
};

export const findApplicationModulesById = async (id: string) => {
  return await GxpServiceAppModuleModel.findById(id).populate(
    moduleApplicationPopulate
  );
};

export const updateApplicationModule = async (
  id: string,
  updates: Partial<IGxpServiceAppModule>
) => {
  return await GxpServiceAppModuleModel.findByIdAndUpdate(id, updates, {
    new: true
  }).populate(moduleApplicationPopulate);
};

export const deleteApplcationModule = async (id: string) => {
  return await GxpServiceAppModuleModel.findByIdAndDelete(id);
};
