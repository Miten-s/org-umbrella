import { Request } from "express";
import { Op } from "sequelize";
import { PaginationOptions } from "../utils/pagination.util";
import ServiceRequest, { IServiceRequest } from "../models/gxp-service-service-requests.model";
import Application from "../models/gxp-service-applications.model";
import AssignmentGroup from "../models/gxp-service-assignment-groups.model";
import Workflow from "../models/gxp-service-workflows.model";
import Environment from "../models/gxp-service-environments.model";
import AppModule from "../models/gxp-service-application-modules.model";
import AppRole from "../models/gxp-service-application-roles.model";
import AppService from "../models/gxp-service-application-services.model";
import ServiceRequestAttachment from "../models/gxp-service-request-attachments.model";
import AppGroup from "../models/gxp-service-application-groups.model";
import AppAttachment from "../models/gxp-service-application-attachments.model";
import ServiceRequestCounter from "../models/gxp-service-service-request-counters.model";
import ServiceRequestComment from "../models/gxp-service-service-request-comments.model";

/**
 * Split a service-request payload into (a) plain model columns, (b) the M2M
 * module/role id arrays, and (c) the comment strings.
 *
 * The service layer normalizes relations to the keys `environment` / `workflow`
 * / `assignmentGroup` / `requestTypes` (+ `modules` / `roles` / `comments`), but
 * the model columns are `environmentId` / `workflowId` / `assignmentGroupId` /
 * `requestTypesId`, and modules/roles/comments are associations. Sequelize
 * silently drops unknown keys on `.create()` / `.update()`, so we map + peel
 * them here and persist the relations explicitly.
 */
const splitServiceRequestRelations = (data: Record<string, any>) => {
  const fields = { ...data };

  const moduleIds = Array.isArray(fields.modules)
    ? (fields.modules as string[]).filter(Boolean)
    : undefined;
  const roleIds = Array.isArray(fields.roles)
    ? (fields.roles as string[]).filter(Boolean)
    : undefined;
  const comments = Array.isArray(fields.comments)
    ? (fields.comments as unknown[])
        .map((c) => (typeof c === "string" ? c : String((c as any)?.commentText ?? "")))
        .map((c) => c.trim())
        .filter(Boolean)
    : undefined;
  delete fields.modules;
  delete fields.roles;
  delete fields.comments;

  // Map the alias FK keys onto the actual model columns.
  if ("environment" in fields) {
    fields.environmentId = fields.environment ?? null;
    delete fields.environment;
  }
  if ("workflow" in fields) {
    fields.workflowId = fields.workflow ?? null;
    delete fields.workflow;
  }
  if ("assignmentGroup" in fields) {
    fields.assignmentGroupId = fields.assignmentGroup ?? null;
    delete fields.assignmentGroup;
  }
  if ("requestTypes" in fields) {
    fields.requestTypesId = fields.requestTypes ?? null;
    delete fields.requestTypes;
  }

  return { fields, moduleIds, roleIds, comments };
};

/** Replace the comment rows for a service request with the given strings. */
const replaceServiceRequestComments = async (
  serviceRequestId: string,
  comments: string[]
) => {
  await ServiceRequestComment.destroy({ where: { serviceRequestId } });
  if (comments.length) {
    await ServiceRequestComment.bulkCreate(
      comments.map((commentText) => ({ serviceRequestId, commentText } as any))
    );
  }
};

const formatServiceRequest = (sr: any) => {
  if (!sr) return null;
  const json = sr.toJSON ? sr.toJSON() : { ...sr };
  
  json._id = json.id;

  if (json.applicationDetails) {
    json.application = {
      ...json.applicationDetails,
      _id: json.applicationDetails.id
    };
    if (json.application.applicationModules) {
      json.application.applicationModules = json.application.applicationModules.map((m: any) => ({ ...m, _id: m.id, moduleId: m.moduleIdString }));
    }
    if (json.application.applicationGroups) {
      json.application.applicationGroups = json.application.applicationGroups.map((g: any) => ({ ...g, _id: g.id }));
    }
    if (json.application.applicationServiceRequestTypes) {
      json.application.applicationServiceRequestTypes = json.application.applicationServiceRequestTypes.map((rt: any) => ({ ...rt, _id: rt.id }));
    }
    if (json.application.attachments) {
      json.application.attachments = json.application.attachments.map((a: any) => ({ ...a, _id: a.id }));
    }
    delete json.applicationDetails;
  }

  if (json.assignmentGroupDetails) {
    json.assignmentGroup = {
      ...json.assignmentGroupDetails,
      _id: json.assignmentGroupDetails.id
    };
    delete json.assignmentGroupDetails;
  }

  if (json.workflowDetails) {
    json.workflow = {
      ...json.workflowDetails,
      _id: json.workflowDetails.id
    };
    delete json.workflowDetails;
  }

  if (json.environmentDetails) {
    json.environment = {
      ...json.environmentDetails,
      _id: json.environmentDetails.id
    };
    delete json.environmentDetails;
  }

  if (json.requestModules) {
    json.modules = json.requestModules.map((m: any) => ({
      ...m,
      _id: m.id,
      moduleId: m.moduleIdString
    }));
    delete json.requestModules;
  }

  if (json.requestRoles) {
    json.roles = json.requestRoles.map((r: any) => ({
      ...r,
      _id: r.id
    }));
    delete json.requestRoles;
  }

  if (json.requestTypesDetails) {
    json.requestTypes = {
      ...json.requestTypesDetails,
      _id: json.requestTypesDetails.id
    };
    delete json.requestTypesDetails;
  }

  if (json.attachments) {
    json.attachments = json.attachments.map((a: any) => ({
      ...a,
      _id: a.id
    }));
  }

  // Expose comments as a plain string[] (the shape the form/edit-seed expects).
  if (Array.isArray(json.comments)) {
    json.comments = json.comments
      .map((c: any) => (typeof c === "string" ? c : c?.commentText))
      .filter(Boolean);
  }

  json.application = json.application || json.applicationId;
  json.assignmentGroup = json.assignmentGroup || json.assignmentGroupId;
  json.workflow = json.workflow || json.workflowId;
  json.environment = json.environment || json.environmentId;
  json.requestTypes = json.requestTypes || json.requestTypesId;

  return json;
};

export const createServiceRequest = async (data: Partial<IServiceRequest>) => {
  const { fields, moduleIds, roleIds, comments } = splitServiceRequestRelations(
    data as Record<string, any>
  );
  const doc = await ServiceRequest.create(fields as any);
  if (moduleIds) await (doc as any).setRequestModules(moduleIds);
  if (roleIds) await (doc as any).setRequestRoles(roleIds);
  if (comments) await replaceServiceRequestComments(doc.id, comments);
  return formatServiceRequest(doc);
};

export const getNextServiceRequestSequence = async (applicationId: string) => {
  const [counter, created] = await ServiceRequestCounter.findOrCreate({
    where: { applicationId },
    defaults: { applicationId, seq: 0 }
  });
  await counter.increment("seq", { by: 1 });
  await counter.reload();
  return counter.seq;
};

export const getAllServiceRequests = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const where: any = {};
  if (search) {
    where[Op.or] = [
      { serviceRequestId: { [Op.iLike]: `%${search}%` } },
      { shortDescription: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }
  const { count: totalCount, rows: data } = await ServiceRequest.findAndCountAll({
    where,
    include: [
      {
        model: Application,
        as: "applicationDetails",
        attributes: ["applicationName", "id"]
      }
    ],
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });
  return {
    data: data.map(formatServiceRequest),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const getServiceRequestById = async (id: string) => {
  const doc = await ServiceRequest.findByPk(id, {
    include: [
      {
        model: AssignmentGroup,
        as: "assignmentGroupDetails",
        attributes: ["groupName", "id", "isActive"]
      },
      {
        model: Workflow,
        as: "workflowDetails",
        attributes: ["workflowName", "id"]
      },
      {
        model: Environment,
        as: "environmentDetails",
        attributes: ["environmentName", "id"]
      },
      {
        model: AppModule,
        as: "requestModules",
        attributes: ["id", "moduleName", "moduleIdString"]
      },
      {
        model: AppRole,
        as: "requestRoles",
        attributes: ["id", "role", "active"]
      },
      {
        model: AppService,
        as: "requestTypesDetails",
        attributes: ["service", "id", "active"]
      },
      {
        model: ServiceRequestAttachment,
        as: "attachments",
        attributes: ["attachment", "id"]
      },
      {
        model: ServiceRequestComment,
        as: "comments",
        attributes: ["id", "commentText"]
      },
      {
        model: Application,
        as: "applicationDetails",
        attributes: ["applicationName", "id", "notes"],
        include: [
          {
            model: AppModule,
            as: "applicationModules",
            attributes: ["id", "moduleName", "moduleIdString"]
          },
          {
            model: AppGroup,
            as: "applicationGroups",
            attributes: ["appGroup", "id"]
          },
          {
            model: AppService,
            as: "applicationServiceRequestTypes",
            attributes: ["service", "id", "active"]
          },
          {
            model: AppAttachment,
            as: "attachments",
            attributes: ["attachment", "id"]
          }
        ]
      }
    ]
  });
  return formatServiceRequest(doc);
};

export const getServiceRequestIdentityById = async (id: string) => {
  const doc = await ServiceRequest.findByPk(id, {
    attributes: ["id", "applicationId", "serviceRequestId"]
  });
  if (!doc) return null;
  const json = doc.toJSON ? doc.toJSON() : { ...doc };
  return {
    _id: json.id,
    id: json.id,
    application: json.applicationId,
    serviceRequestId: json.serviceRequestId
  };
};

export const updateServiceRequest = async (
  id: string,
  data: Partial<IServiceRequest>
) => {
  const doc = await ServiceRequest.findByPk(id);
  if (!doc) return null;
  const { fields, moduleIds, roleIds, comments } = splitServiceRequestRelations(
    data as Record<string, any>
  );
  await doc.update(fields);
  // Only touch a relation when the caller actually sent it (partial update).
  if (moduleIds) await (doc as any).setRequestModules(moduleIds);
  if (roleIds) await (doc as any).setRequestRoles(roleIds);
  if (comments) await replaceServiceRequestComments(id, comments);
  return formatServiceRequest(doc);
};

export const deleteServiceRequest = async (id: string) => {
  const doc = await ServiceRequest.findByPk(id);
  if (!doc) return null;
  await doc.destroy();
  return formatServiceRequest(doc);
};

export const bulkDeleteServiceRequests = async (ids: string[]) => {
  return await ServiceRequest.destroy({
    where: { id: ids }
  });
};

export const getServiceTypes = async (req: Request) => {
  const { name, id } = req.query;
  const where: any = { active: true };
  if (id) {
    where.id = id;
  }
  if (name) {
    where.service = { [Op.iLike]: `%${name}%` };
  }
  const data = await AppService.findAll({ where });
  return data.map((d: any) => {
    const json = d.toJSON ? d.toJSON() : { ...d };
    json._id = json.id;
    return json;
  });
};
