import { Request } from "express";
import { randomUUID } from "crypto";
import { IServiceRequest } from "../models/gxp-service-service-requests.model";
import * as repo from "../repo/gxp-service-service-requests.repo";
import GxpServiceRequestAttachmentModel from "../models/gxp-service-request-attachments.model";
import GxpServiceAppModuleModel from "../models/gxp-service-application-modules.model";
import GxpServiceAppRoleModel from "../models/gxp-service-application-roles.model";
import GxpServiceAppServiceModel from "../models/gxp-service-application-services.model";
import { resolveIds } from "./mixed-id-resolution.service";
import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import { PaginationOptions } from "../utils/pagination.util";

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

const normalizeServiceRequestCodeSegment = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const buildServiceRequestId = (applicationName: string, sequence: number): string => {
  const normalizedAppName =
    normalizeServiceRequestCodeSegment(applicationName) || "APP";
  const paddedSequence = String(sequence).padStart(4, "0");
  return `SR_${normalizedAppName}_${paddedSequence}`;
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
  payload.location = extractSingleId(
    payload.location ?? payload.groupLocation
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
  delete payload.groupLocation;
  delete payload.applicationWorkflow;
  delete payload.applicationModules;
  delete payload.applicationServiceRequestTypes;
  delete payload.applicationRoles;
  delete payload.requestType;
  delete payload.serviceRequestId;

  const applicationId = extractSingleId(payload.application);
  if (!applicationId) {
    throw new Error("Application is required");
  }

  const applicationRecord = await GxpServiceApplicationModel.findByPk(
    applicationId,
    {
      attributes: ["applicationName"],
      raw: true
    }
  );

  if (!applicationRecord?.applicationName) {
    throw new Error("Application not found");
  }

  const nextSequence = await repo.getNextServiceRequestSequence(applicationId);
  // `id` is the PK (varchar, no DB default) — generate a UUID for it
  payload.id = randomUUID();
  // `serviceRequestId` is the human-readable SR_APP_XXXX display ID
  payload.serviceRequestId = buildServiceRequestId(
    applicationRecord.applicationName,
    nextSequence
  );
  // Model FK column is `applicationId`, not `application`
  payload.applicationId = applicationId;
  delete payload.application;

  const newRequest = await repo.createServiceRequest(payload);

  // Attachments
  if (attachments?.length) {
    await Promise.all(
      attachments.map((attachment) =>
        GxpServiceRequestAttachmentModel.create({
          serviceRequestId: newRequest.id,
          attachment,
          active: true,
          createdBy: data.createdBy || null
        })
      )
    );
  }

  return await repo.getServiceRequestById(newRequest.id);
};


export const fetchAllRequests = async (options: PaginationOptions) => {
  return await repo.getAllServiceRequests(options);
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

  const existingRequest = (await repo.getServiceRequestIdentityById(id)) as
    | { _id?: string; application?: unknown; serviceRequestId?: string }
    | null;
  if (!existingRequest) {
    throw new Error("Service Request not found");
  }

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
  if ("location" in payload || "groupLocation" in payload) {
    payload.location = extractSingleId(
      payload.location ?? payload.groupLocation
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
  delete payload.groupLocation;
  delete payload.applicationWorkflow;
  delete payload.applicationModules;
  delete payload.applicationServiceRequestTypes;
  delete payload.applicationRoles;
  delete payload.requestType;
  delete payload.serviceRequestId;

  // Normalize application → applicationId for Sequelize FK column
  if ("application" in payload) {
    const appId = extractSingleId(payload.application);
    if (appId) payload.applicationId = appId;
    delete payload.application;
  }

  if (!existingRequest.serviceRequestId) {
    const applicationId =
      (payload.applicationId as string | undefined) ??
      extractSingleId(existingRequest.application);
    if (!applicationId) {
      throw new Error("Application is required");
    }

    const applicationRecord = await GxpServiceApplicationModel.findByPk(
      applicationId,
      {
        attributes: ["applicationName"],
        raw: true
      }
    );

    if (!applicationRecord?.applicationName) {
      throw new Error("Application not found");
    }

    const nextSequence = await repo.getNextServiceRequestSequence(applicationId);
    // For update, serviceRequestId is a separate column in the model
    // (the model stores it in the `serviceRequestId` field, separate from the PK `id`)
    // But since `id` is already the SR_APP_XXXX string acting as PK,
    // we don't need to reassign it here for updates.
    payload.serviceRequestId = buildServiceRequestId(
      applicationRecord.applicationName,
      nextSequence
    );
  }

  // Attachments
  if (attachments?.length) {
    await Promise.all(
      attachments.map((attachment) =>
        GxpServiceRequestAttachmentModel.create({
          serviceRequestId: id,
          attachment,
          active: true,
          createdBy: data.modifiedBy || null
        })
      )
    );
  }

  await repo.updateServiceRequest(id, payload);
  return await repo.getServiceRequestById(id);
};

export const deleteRequest = async (id: string) => {
  return await repo.deleteServiceRequest(id);
};

export const bulkDeleteRequests = async (ids: string[]) => {
  return await repo.bulkDeleteServiceRequests(ids);
};

export const getServiceTypes = async (req: Request) => {
  return await repo.getServiceTypes(req);
};
