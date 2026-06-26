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

  json.application = json.application || json.applicationId;
  json.assignmentGroup = json.assignmentGroup || json.assignmentGroupId;
  json.workflow = json.workflow || json.workflowId;
  json.environment = json.environment || json.environmentId;
  json.requestTypes = json.requestTypes || json.requestTypesId;

  return json;
};

export const createServiceRequest = async (data: Partial<IServiceRequest>) => {
  const doc = await ServiceRequest.create(data as any);
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
  await doc.update(data);
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
