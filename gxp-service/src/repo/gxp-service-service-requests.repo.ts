import { IServiceRequest } from "../models/gxp-service-service-requests.model.js";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model.js";

export const createServiceRequest = async (data: IServiceRequest) => {
  return await GxpServiceRequestModel.create(data);
};

export const getAllServiceRequests = async () => {
  return await GxpServiceRequestModel.find()
    .populate("application", ["applicationName", "_id"])
    .populate("workflow", ["workflowName", "_id"])
    .lean();
};

export const getServiceRequestById = async (id: string) => {
  return await GxpServiceRequestModel.findById(id)
    .populate("application", ["applicationName", "_id"])
    .populate("workflow", ["workflowName", "_id"])
    .populate("environment", ["environmentName", "_id"])
    .populate("module", ["moduleName", "_id"])
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
