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
