import { IServiceRequest } from "../models/gxp-service-service-requests.model.js";
import { ServiceRequestModel } from "../models/gxp-service-service-requests.model.js";

export const createServiceRequest = async (data: IServiceRequest) => {
  return await ServiceRequestModel.create(data);
};

export const getAllServiceRequests = async () => {
  return await ServiceRequestModel.find();
};

export const getServiceRequestById = async (id: string) => {
  return await ServiceRequestModel.findById(id);
};
