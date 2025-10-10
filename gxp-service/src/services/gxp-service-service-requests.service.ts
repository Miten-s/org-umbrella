// src/services/serviceRequest.service.ts

import { IServiceRequest } from "../models/gxp-service-service-requests.model.js";
import {
  createServiceRequest as createRepo,
  getAllServiceRequests,
  getServiceRequestById
} from "../repo/gxp-service-service-requests.repo.js";

export const createServiceRequest = async (data: IServiceRequest) => {
  return await createRepo(data);
};

export const fetchAllRequests = async () => {
  return await getAllServiceRequests();
};

export const fetchRequestById = async (id: string) => {
  return await getServiceRequestById(id);
};
