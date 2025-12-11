import { populate } from "dotenv";
import GxpServiceApplicationModel, {
  type IApplication
} from "../models/gxp-service-applications.model";

export const createApplication = async (payload: Partial<IApplication>) => {
  const doc = new GxpServiceApplicationModel(payload);
  return await doc.save();
};

export const getApplications = async (
  filter = {},
  projection = null,
  options = {}
) => {
  return await GxpServiceApplicationModel.find(filter, projection, options)
    .populate("applicationGroups", ["appGroup", "active"])
    .populate("applicationEnvironment", ["environmentName"])
    .lean();
};

export const findApplicationById = async (id: string) => {
  const POPULATE_FIELDS = [
    "applicationEnvironment",
    "group",
    "applicationRoles",
    "applicationGroups",
    "applicationServiceRequestTypes",
    "applicationModules",
    "applicationWorkflow",
    "applicationSystemOwner",
    "applicationProcessOwner",
    "supplier",
    "departments",
    "attachments"
  ];

  const POPULATE_PROJECTION = {
    __v: 0,
    createdAt: 0,
    updatedAt: 0
  };

  let query = GxpServiceApplicationModel.findById(id);
  for (const field of POPULATE_FIELDS) {
    query = query.populate({ path: field, select: POPULATE_PROJECTION });
  }

  return await query;
};

export const updateApplication = async (
  id: string,
  updates: Partial<IApplication>
) => {
  return await GxpServiceApplicationModel.findByIdAndUpdate(id, updates, {
    new: true
  });
};

export const disableApplication = async (id: string) => {
  return await GxpServiceApplicationModel.findByIdAndUpdate(
    id,
    { status: "disabled" },
    { new: true }
  );
};

export const enableApplication = async (id: string) => {
  return await GxpServiceApplicationModel.findByIdAndUpdate(
    id,
    { status: "enabled" },
    { new: true }
  );
};

export const deleteApplcation = async (id: string) => {
  return await GxpServiceApplicationModel.findByIdAndDelete(id);
};
