import { Request } from "express";
import { IServiceRequest } from "../models/gxp-service-service-requests.model";
import * as repo from "../repo/gxp-service-service-requests.repo";
import GxpServiceRequestAttachmentModel from "../models/gxp-service-request-attachments.model";
import { GxpServiceAppModuleModel } from "../models/gxp-service-application-modules.model";
import { fetchRolesFromAuthService } from "./inter-service-calls.service";

const extractId = (field: any) => {
  if (!field) return undefined;
  if (typeof field === "string") return field;
  if (field._id) return field._id;
  if (field.id) return field.id;
  return undefined;
};

const extractIds = (fields: any[]) => {
  if (!fields || !Array.isArray(fields)) return [];
  return fields.map((f) => extractId(f)).filter(Boolean);
};

const processArrayField = async (
  items: any[],
  model: any,
  searchKey: string
) => {
  if (!items || !Array.isArray(items)) return [];

  const ids: string[] = [];
  
  for (const item of items) {
    if (typeof item === "string") {
      ids.push(item);
    } else if (item && typeof item === "object") {
       if (item._id) {
         ids.push(item._id);
       } else if (item.name || item[searchKey]) {
          const name = item.name || item[searchKey];
          // Create on fly logic
          let existing = await model.findOne({ [searchKey]: name });
          if (!existing) {
             existing = await model.create({ [searchKey]: name });
          }
          ids.push(existing._id.toString());
       }
    }
  }
  
  return ids;
};

export const createServiceRequest = async (
  data: Partial<IServiceRequest>,
  attachments?: string[]
) => {
  const payload = { ...data };

  // Extract IDs from Objects
  payload.environment = extractId(payload.environment);
  payload.workflow = extractId(payload.workflow);
  
  // Smart processing for Modules and Request Types
  payload.modules = await processArrayField(
    payload.modules as any[], 
    GxpServiceAppModuleModel, 
    "moduleName"
  );
  
  payload.roles = extractIds(payload?.roles ?? []);
  
  const newRequest = await repo.createServiceRequest(payload);

  // Attachments
  if (attachments?.length) {
    const createdAttachments = await Promise.all(
      attachments.map((attachment) =>
        GxpServiceRequestAttachmentModel.create({
          srvId: newRequest._id,
          attachment,
          active: true,
          createdBy: data.createdBy
        })
      )
    );

    
    newRequest.attachments = createdAttachments.map((doc) =>
      doc._id.toString()
    );

    await newRequest.save();
  }

  return newRequest;
};

export const fetchAllRequests = async () => {
  return await repo.getAllServiceRequests();
};

export const fetchRequestById = async (id: string) => {
  const serviceRequest =  await repo.getServiceRequestById(id)
  if (!serviceRequest) throw new Error("Service Request not found");

  // From Auth Service
  serviceRequest.roles = await fetchRolesFromAuthService(serviceRequest?.roles ?? [] , ["name"]) as any;
  return serviceRequest;
};

export const updateRequest = async (
  id: string,
  data: any,
  attachments?: string[]
) => {
  const payload = { ...data };

  if (payload.modules) {
      payload.modules = await processArrayField(
        payload.modules,
        GxpServiceAppModuleModel,
        "moduleName"
      );
  }

  if (payload.roles) payload.roles = extractIds(payload.roles);

  // Attachments
  if (attachments?.length) {
      const createdAttachments = await Promise.all(
        attachments.map((attachment) =>
          GxpServiceRequestAttachmentModel.create({
            srvId: id,
            attachment,
            active: true,
            createdBy: data.modifiedBy // Assuming modifiedBy is passed
          })
        )
      );
      
      const newIds = createdAttachments.map(d => d._id.toString());
      payload.attachments = [...(payload.attachments || []), ...newIds]; 
  }

  return await repo.updateServiceRequest(id, payload);
};

export const deleteRequest = async (id: string) => {
  return await repo.deleteServiceRequest(id);
};

export const getServiceTypes = async (req: Request) => {
  return await repo.getServiceTypes(req);
};
