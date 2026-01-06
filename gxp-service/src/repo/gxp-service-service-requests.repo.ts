import { Request } from "express";
import GxpRequestAttachmentModel from "../models/gxp-service-requests-attachments.model.js";
import { IServiceRequest } from "../models/gxp-service-service-requests.model.js";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model.js";
import { removeUndefinedEntries } from "../utils/common.util.js";
import GxpServiceAppServiceModel from "../models/gxp-service-application-services.model.js";

export const createServiceRequest = async (data: IServiceRequest) => {
  const request = new GxpServiceRequestModel(data);
  return await request.save();
};

export const getAllServiceRequests = async () => {
  const serviceRequest = await GxpServiceRequestModel.find()
    .populate("application", ["applicationName", "_id"])
    .lean();

  return await Promise.all(
    serviceRequest.map(async (request) => {
      const attachments = await GxpRequestAttachmentModel.find(
        {
          requestId: request._id
        },
        { attachment: 1 }
      ).lean();
      return { ...request, attachments };
    })
  );
};

export const getServiceRequestById = async (id: string) => {
  const request = await GxpServiceRequestModel.findById(id)
    .populate("application", [
      "applicationName",
      "_id",
      "applicationModules",
      "applicationRoles",
      "applicationGroups"
    ])
    .lean();

  return {
    ...request,
    attachments: await GxpRequestAttachmentModel.find(
      {
        requestId: id
      },
      { attachment: 1 }
    ).lean()
  };
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

export const deleteAttachments = async (id: string) => {
  return await GxpRequestAttachmentModel.deleteOne({ _id: id });
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
