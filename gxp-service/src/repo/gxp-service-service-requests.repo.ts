import { Request } from "express";
import { IServiceRequest } from "../models/gxp-service-service-requests.model.js";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model.js";
import { removeUndefinedEntries } from "../utils/common.util.js";
import GxpServiceAppServiceModel from "../models/gxp-service-application-services.model.js";

export const createServiceRequest = async (data: IServiceRequest) => {
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
    .populate({
      path: "application",
      select: [
        "applicationName",
        "_id",
        "applicationModules",
        "applicationRoles",
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
          path: "applicationRoles",
          select: ["role", "_id"]
        },
        {
          path: "applicationGroups",
          select: ["appGroup", "_id"]
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
