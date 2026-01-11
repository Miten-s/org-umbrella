import { Request } from "express";
import { IServiceRequest } from "../models/gxp-service-service-requests.model.js";
import * as repo from "../repo/gxp-service-service-requests.repo.js";

export const createServiceRequest = async (data: IServiceRequest) => {
  return await repo.createServiceRequest(data);
};

export const fetchAllRequests = async () => {
  return await repo.getAllServiceRequests();
};

export const fetchRequestById = async (id: string) => {
  return await repo.getServiceRequestById(id);
};

export const updateRequest = async (
  id: string,
  data: Partial<IServiceRequest>
) => {
  return await repo.updateServiceRequest(id, data);
};

export const deleteRequest = async (id: string) => {
  return await repo.deleteServiceRequest(id);
};

export const getServiceTypes = async (req: Request) => {
  return await repo.getServiceTypes(req);
};
