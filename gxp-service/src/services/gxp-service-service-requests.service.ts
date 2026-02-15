import { Request } from "express";
import { IServiceRequest } from "../models/gxp-service-service-requests.model";
import * as repo from "../repo/gxp-service-service-requests.repo";
import GxpServiceRequestAttachmentModel from "../models/gxp-service-request-attachments.model";
import { GxpServiceAppModuleModel } from "../models/gxp-service-application-modules.model";
import GxpServiceAppRoleModel from "../models/gxp-service-application-roles.model";
import GxpServiceAppServiceModel from "../models/gxp-service-application-services.model";
import { resolveIds } from "./gxp-service-applications.service";

const extractSingleId = (field: unknown): string | undefined => {
  if (!field) return undefined;
  if (typeof field === "string") return field;
  if (typeof field === "object") {
    const asRecord = field as Record<string, unknown> & {
      _id?: string;
      id?: string;
      value?: string;
    };
    return asRecord._id ?? asRecord.id ?? asRecord.value;
  }
  return undefined;
};

const normalizeNotes = (rawNotes: unknown): string[] | undefined => {
  if (typeof rawNotes === "string") {
    const trimmed = rawNotes.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(rawNotes)) {
    return rawNotes
      .map((note) => (typeof note === "string" ? note.trim() : ""))
      .filter(Boolean);
  }
  return undefined;
};

const extractSingleRequestType = (value: unknown): unknown => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export const createServiceRequest = async (
  data: Partial<IServiceRequest>,
  attachments?: string[]
) => {
  const payload = { ...data } as Record<string, any>;

  payload.environment = extractSingleId(
    payload.environment ?? payload.applicationEnvironment
  );
  payload.workflow = extractSingleId(
    payload.workflow ?? payload.applicationWorkflow
  );
  payload.assignmentGroup = extractSingleId(
    payload.assignmentGroup ?? payload.group
  );

  const moduleIds = await resolveIds(
    payload.modules ?? payload.applicationModules,
    {
      model: GxpServiceAppModuleModel,
      nameField: "moduleName",
      nameKeys: ["name", "moduleName"]
    }
  );
  if (moduleIds) payload.modules = moduleIds;

  const roleIds = await resolveIds(payload.roles ?? payload.applicationRoles, {
    model: GxpServiceAppRoleModel,
    nameField: "role",
    nameKeys: ["name", "role", "roleName"]
  });
  if (roleIds) payload.roles = roleIds;

  const requestTypeRaw = extractSingleRequestType(
    payload.requestTypes ??
      payload.applicationServiceRequestTypes ??
      payload.requestType
  );
  const requestTypeIds = await resolveIds(
    requestTypeRaw ? [requestTypeRaw] : [],
    {
      model: GxpServiceAppServiceModel,
      nameField: "service",
      nameKeys: ["name", "service"]
    }
  );
  payload.requestTypes = requestTypeIds?.[0] ?? null;

  const notes = normalizeNotes(payload.notes);
  if (notes) payload.notes = notes;

  delete payload.applicationEnvironment;
  delete payload.group;
  delete payload.applicationWorkflow;
  delete payload.applicationModules;
  delete payload.applicationServiceRequestTypes;
  delete payload.applicationRoles;
  delete payload.requestType;

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
  const serviceRequest = (await repo.getServiceRequestById(id)) as Record<
    string,
    any
  > | null;
  if (!serviceRequest) throw new Error("Service Request not found");

  // Ensure frontend always receives request type details under application.
  if (
    serviceRequest.application &&
    typeof serviceRequest.application === "object" &&
    !Array.isArray(serviceRequest.application.applicationServiceRequestTypes)
  ) {
    const fallbackTypes = Array.isArray(serviceRequest.requestTypes)
      ? serviceRequest.requestTypes
      : serviceRequest.requestTypes
        ? [serviceRequest.requestTypes]
        : [];
    serviceRequest.application.applicationServiceRequestTypes = fallbackTypes;
  }

  return serviceRequest;
};

export const updateRequest = async (
  id: string,
  data: any,
  attachments?: string[]
) => {
  const payload = { ...data } as Record<string, any>;

  if ("environment" in payload || "applicationEnvironment" in payload) {
    payload.environment = extractSingleId(
      payload.environment ?? payload.applicationEnvironment
    );
  }
  if ("workflow" in payload || "applicationWorkflow" in payload) {
    payload.workflow = extractSingleId(
      payload.workflow ?? payload.applicationWorkflow
    );
  }
  if ("assignmentGroup" in payload || "group" in payload) {
    payload.assignmentGroup = extractSingleId(
      payload.assignmentGroup ?? payload.group
    );
  }

  if ("modules" in payload || "applicationModules" in payload) {
    const moduleIds = await resolveIds(
      payload.modules ?? payload.applicationModules,
      {
        model: GxpServiceAppModuleModel,
        nameField: "moduleName",
        nameKeys: ["name", "moduleName"]
      }
    );
    if (moduleIds) payload.modules = moduleIds;
  }

  if ("roles" in payload || "applicationRoles" in payload) {
    const roleIds = await resolveIds(
      payload.roles ?? payload.applicationRoles,
      {
        model: GxpServiceAppRoleModel,
        nameField: "role",
        nameKeys: ["name", "role", "roleName"]
      }
    );
    if (roleIds) payload.roles = roleIds;
  }

  if (
    "requestTypes" in payload ||
    "requestType" in payload ||
    "applicationServiceRequestTypes" in payload
  ) {
    const requestTypeRaw = extractSingleRequestType(
      payload.requestTypes ??
        payload.applicationServiceRequestTypes ??
        payload.requestType
    );
    const requestTypeIds = await resolveIds(
      requestTypeRaw ? [requestTypeRaw] : [],
      {
        model: GxpServiceAppServiceModel,
        nameField: "service",
        nameKeys: ["name", "service"]
      }
    );
    payload.requestTypes = requestTypeIds?.[0] ?? null;
  }

  if ("notes" in payload) {
    const notes = normalizeNotes(payload.notes);
    if (notes) payload.notes = notes;
  }

  delete payload.applicationEnvironment;
  delete payload.group;
  delete payload.applicationWorkflow;
  delete payload.applicationModules;
  delete payload.applicationServiceRequestTypes;
  delete payload.applicationRoles;
  delete payload.requestType;

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

    const newIds = createdAttachments.map((d) => d._id.toString());
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
