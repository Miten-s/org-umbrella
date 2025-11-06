import { IServiceRequest } from "../models/gxp-service-service-requests.model.js";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model.js";

export const createServiceRequest = async (data: IServiceRequest) => {
  return await GxpServiceRequestModel.create(data);
};

export const getAllServiceRequests = async () => {
  return await GxpServiceRequestModel.find();
};

export const getServiceRequestById = async (id: string) => {
  return await GxpServiceRequestModel.findById(id);
};

export const updateServiceRequest = async (
  id: string,
  data: IServiceRequest
) => {
  return await GxpServiceRequestModel.findByIdAndUpdate(
    id,
    { $set: data },
    {
      new: true
    }
  );
};

export const deleteServiceRequest = async (id: string) => {
  return await GxpServiceRequestModel.findByIdAndDelete(id);
};
