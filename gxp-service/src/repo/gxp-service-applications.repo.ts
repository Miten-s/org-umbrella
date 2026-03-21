import GxpServiceAppAttachmentModel from "../models/gxp-service-application-attachments.model";
import GxpServiceAppGroupModel from "../models/gxp-service-application-groups.model";
import GxpServiceAppRoleModel from "../models/gxp-service-application-roles.model";
import GxpServiceApplicationModel, {
  type IApplication
} from "../models/gxp-service-applications.model";
import { fetchUserBasedOnId } from "../services/inter-service-calls.service";

const POPULATE_FIELDS = [
  "applicationEnvironment",
  "assignmentGroup",
  "applicationRoles",
  "applicationGroups",
  "applicationServiceRequestTypes",
  "applicationModules",
  "applicationWorkflow",
  "supplier",
  "attachments"
] as const;

const POPULATE_PROJECTION = {
  __v: 0,
  createdAt: 0,
  updatedAt: 0
} as const;

export const createApplication = async (
  payload: Partial<IApplication>,
  session?: any
) => {
  const doc = new GxpServiceApplicationModel(payload);
  await doc.save({ session });
  return doc;
};

export const findApplicationByIdRaw = async (id: string) => {
  return await GxpServiceApplicationModel.findById(id).lean();
};

export const getApplications = async (
  filter = {},
  projection = null,
  options = {}
) => {
  return await GxpServiceApplicationModel.find(filter, projection, options)
    .populate("applicationGroups", ["appGroup", "active"])
    .populate("applicationEnvironment", ["environmentName"])
    .populate("assignmentGroup", ["groupName", "isActive"])
    .lean();
};

export const findApplicationById = async (id: string) => {
  const application = await GxpServiceApplicationModel.findById(id)
    .populate(
      POPULATE_FIELDS.map((field) => ({
        path: field,
        select: POPULATE_PROJECTION
      }))
    )
    .lean();

  if (!application) return null;

  const { applicationSystemOwner, applicationProcessOwner } = application;

  const userIds = Array.from(
    new Set([applicationSystemOwner, applicationProcessOwner].filter(Boolean))
  );

  const users = await fetchUserBasedOnId(userIds as string[]);

  const usersMap = users.reduce<Record<string, any>>((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});

  return {
    ...application,
    applicationSystemOwner:
      applicationSystemOwner && usersMap[applicationSystemOwner.toString()],
    applicationProcessOwner:
      applicationProcessOwner && usersMap[applicationProcessOwner.toString()]
  };
};

export const updateApplication = async (
  id: string,
  updates: Partial<IApplication>
) => {
  return await GxpServiceApplicationModel.findOneAndUpdate(
    { _id: id },
    { $set: updates },
    {
      new: true
    }
  );
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

export const deleteApplcation = async (id: string, session?: any) => {
  return await GxpServiceApplicationModel.findByIdAndDelete(id, { session });
};

export const deleteAttachments = async (id: string) => {
  return await GxpServiceAppAttachmentModel.deleteOne({ _id: id });
};

export const getApplicationGroups = async () => {
  const groups = await GxpServiceAppGroupModel.find();
  return groups;
};

export const getApplicationRoles = async () => {
  const roles = await GxpServiceAppRoleModel.find();
  return roles;
};
