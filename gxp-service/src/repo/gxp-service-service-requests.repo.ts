import GxpRequestAttachmentModel from "../models/gxp-service-requests-attachments.model.js";
import { IServiceRequest } from "../models/gxp-service-service-requests.model.js";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model.js";

export const createServiceRequest = async (data: IServiceRequest) => {
  const attachments = data.attachments || [];
  const request = new GxpServiceRequestModel(data);

  for (const attachment of attachments) {
    await GxpRequestAttachmentModel.create({
      requestId: request._id,
      attachment,
      active: true
    });
  }

  return await request.save();
};

export const getAllServiceRequests = async () => {
  const serviceRequest = await GxpServiceRequestModel.find()
    .populate("application", ["applicationName", "_id"])
    .populate("workflow", ["workflowName", "_id"])
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
    .populate("application", ["applicationName", "_id"])
    .populate("workflow", ["workflowName", "_id"])
    .populate("environment", ["environmentName", "_id"])
    .populate("module", ["moduleName", "_id"])
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
  const attachments = data.attachments || [];

  for (const attachment of attachments) {
    await GxpRequestAttachmentModel.create({
      requestId: id,
      attachment,
      active: true
    });
  }

  delete data.attachments;

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
