import { Request } from "express";
import { IServiceRequest } from "../models/gxp-service-service-requests.model";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model";
import { removeUndefinedEntries } from "../utils/common.util";
import GxpServiceAppServiceModel from "../models/gxp-service-application-services.model";

export const createServiceRequest = async (data: Partial<IServiceRequest>) => {
  const request = new GxpServiceRequestModel(data);
  return await request.save();
};

export const getAllServiceRequests = async () => {
  return await GxpServiceRequestModel.find()
    .populate("application", ["applicationName", "_id"])
    .lean();
};

export const getServiceRequestById = async (id: string) => {
  return await GxpServiceRequestModel.findById(id)
    .populate("assignmentGroup", ["groupName", "_id", "isActive"])
    .populate("workflow", ["workflowName", "_id"])
    .populate("environment", ["environmentName", "_id"])
    .populate("modules", ["moduleName", "_id"])
    .populate("roles", ["role", "_id", "active"])
    .populate("requestTypes", ["service", "_id", "active"])
    .populate("attachments", ["attachment", "_id"])
    .populate({
      path: "application",
      select: [
        "applicationName",
        "_id",
        "applicationServiceRequestTypes",
        "applicationModules",
        "applicationGroups",
        "attachments",
        "notes"
      ],
      populate: [
        {
          path: "applicationModules",
          select: ["moduleName", "_id"]
        },
        {
          path: "applicationGroups",
          select: ["appGroup", "_id"]
        },
        {
          path: "applicationServiceRequestTypes",
          select: ["service", "_id", "active"]
        },
        {
          path: "attachments",
          select: ["attachment", "_id"]
        }
      ]
    })
    .lean();
};

export const updateServiceRequest = async (
  id: string,
  data: Partial<IServiceRequest>
) => {
  return await GxpServiceRequestModel.findByIdAndUpdate(
    id,
    { $set: data },
    {
      runValidators: true,
      new: true
    }
  );
};

export const deleteServiceRequest = async (id: string) => {
  return await GxpServiceRequestModel.findByIdAndDelete(id);
};
export const getServiceTypes = async (req: Request) => {
  const { name, id } = req.query;
  const filter = removeUndefinedEntries({
    id,
    active: true,
    service: name ? { $regex: name, $options: "i" } : undefined
  });
  return await GxpServiceAppServiceModel.find(filter).lean();
};
