import AppAttachment from "../models/gxp-service-application-attachments.model";
import AppGroup from "../models/gxp-service-application-groups.model";
import AppDepartment from "../models/gxp-service-application-departments.model";
import AppRole from "../models/gxp-service-application-roles.model";
import AppModule from "../models/gxp-service-application-modules.model";
import AppService from "../models/gxp-service-application-services.model";
import Environment from "../models/gxp-service-environments.model";
import AssignmentGroup from "../models/gxp-service-assignment-groups.model";
import Workflow from "../models/gxp-service-workflows.model";
import Supplier from "../models/gxp-service-suppliers.model";
import Application, {
  type IApplication
} from "../models/gxp-service-applications.model";
import { fetchUserBasedOnId } from "../services/inter-service-calls.service";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";

const formatApplication = (app: any) => {
  if (!app) return null;
  const json = app.toJSON ? app.toJSON() : { ...app };
  json._id = json.id;

  if (json.environment) {
    json.applicationEnvironment = {
      ...json.environment,
      _id: json.environment.id
    };
    delete json.environment;
  }

  if (json.assignmentGroup) {
    json.assignmentGroup = {
      ...json.assignmentGroup,
      _id: json.assignmentGroup.id
    };
  }

  if (json.workflow) {
    json.applicationWorkflow = {
      ...json.workflow,
      _id: json.workflow.id
    };
    delete json.workflow;
  }

  if (json.supplier) {
    json.supplier = {
      ...json.supplier,
      _id: json.supplier.id
    };
  }
  if (json.applicationModules) {
    json.applicationModules = json.applicationModules.map((m: any) => ({
      ...m,
      _id: m.id,
      moduleId: m.moduleIdString
    }));
  }

  if (json.attachments) {
    json.attachments = json.attachments.map((a: any) => ({
      ...a,
      _id: a.id
    }));
  }

  if (json.applicationGroups) {
    json.applicationGroups = json.applicationGroups.map((g: any) => ({
      ...g,
      _id: g.id
    }));
  }

  if (json.applicationRoles) {
    json.applicationRoles = json.applicationRoles.map((r: any) => ({
      ...r,
      _id: r.id
    }));
  }

  if (json.applicationServiceRequestTypes) {
    json.applicationServiceRequestTypes = json.applicationServiceRequestTypes.map((s: any) => ({
      ...s,
      _id: s.id
    }));
  }

  json.applicationSystemOwner = json.applicationSystemOwnerId;
  json.applicationProcessOwner = json.applicationProcessOwnerId;
  json.applicationWorkflow = json.applicationWorkflow || json.applicationWorkflowId;
  json.applicationEnvironment = json.applicationEnvironment || json.applicationEnvironmentId;
  json.assignmentGroup = json.assignmentGroup || json.assignmentGroupId;
  json.supplier = json.supplier || json.supplierId;

  return json;
};

export const createApplication = async (
  payload: Partial<IApplication>,
  options?: any
) => {
  const doc = await Application.create(payload as any, options);
  return formatApplication(doc);
};

export const findApplicationByIdRaw = async (id: string) => {
  const doc = await Application.findByPk(id);
  return formatApplication(doc);
};

export const isApplicationNameTaken = async (
  applicationName: string,
  excludeId?: string
): Promise<boolean> => {
  const normalizedName = String(applicationName ?? "").trim();
  if (!normalizedName) return false;

  const where: any = { applicationName: normalizedName };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const existing = await Application.findOne({
    where,
    attributes: ["id"]
  });

  return Boolean(existing);
};

export const getApplications = async (
  filter: any = {},
  options?: Partial<PaginationOptions>
) => {
  const { page = 1, limit = 10, skip = 0, search } = options || {};
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }
  if (search) {
    where[Op.or] = [
      { applicationName: { [Op.iLike]: `%${search}%` } },
      { applicationId: { [Op.iLike]: `%${search}%` } }
    ];
  }
  const { count: totalCount, rows: data } = await Application.findAndCountAll({
    where,
    distinct: true,
    include: [
      {
        model: AppGroup,
        as: "applicationGroups",
        attributes: ["appGroup", "active", "id"]
      },
      {
        model: Environment,
        as: "environment",
        attributes: ["environmentName", "id"]
      },
      {
        model: AssignmentGroup,
        as: "assignmentGroup",
        attributes: ["groupName", "isActive", "id"]
      }
    ],
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });
  return {
    data: data.map(formatApplication),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const findApplicationById = async (id: string) => {
  const applicationDoc = await Application.findByPk(id, {
    include: [
      { model: Environment, as: "environment" },
      { model: AssignmentGroup, as: "assignmentGroup" },
      { model: AppRole, as: "applicationRoles" },
      { model: AppGroup, as: "applicationGroups" },
      { model: AppDepartment, as: "departments" },
      { model: AppService, as: "applicationServiceRequestTypes" },
      { model: AppModule, as: "applicationModules" },
      { model: Workflow, as: "workflow" },
      { model: Supplier, as: "supplier" },
      { model: AppAttachment, as: "attachments" }
    ]
  });

  if (!applicationDoc) return null;
  const application = formatApplication(applicationDoc);

  const { applicationSystemOwner, applicationProcessOwner } = application;

  const userIds = Array.from(
    new Set([applicationSystemOwner, applicationProcessOwner].filter(Boolean))
  );

  const users = await fetchUserBasedOnId(userIds as string[]);

  const usersMap = users.reduce<Record<string, any>>((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});

  return {
    ...application,
    applicationSystemOwner:
      applicationSystemOwner && usersMap[applicationSystemOwner.toString()],
    applicationProcessOwner:
      applicationProcessOwner && usersMap[applicationProcessOwner.toString()]
  };
};

export const updateApplication = async (
  id: string,
  updates: Partial<IApplication>,
  options?: any
) => {
  const doc = await Application.findByPk(id, options);
  if (!doc) return null;
  await doc.update(updates, options);
  return formatApplication(doc);
};

export const disableApplication = async (id: string) => {
  const doc = await Application.findByPk(id);
  if (!doc) return null;
  await doc.update({ status: "disabled" });
  return formatApplication(doc);
};

export const enableApplication = async (id: string) => {
  const doc = await Application.findByPk(id);
  if (!doc) return null;
  await doc.update({ status: "enabled" });
  return formatApplication(doc);
};

export const deleteApplcation = async (id: string, options?: any) => {
  const doc = await Application.findByPk(id, options);
  if (!doc) return null;
  await doc.destroy(options);
  return formatApplication(doc);
};

export const deleteAttachments = async (id: string) => {
  const doc = await AppAttachment.findByPk(id);
  if (!doc) return null;
  await doc.destroy();
  return { _id: id };
};

export const findApplicationsByIds = async (ids: string[]) => {
  const data = await Application.findAll({
    where: { id: ids }
  });
  return data.map(formatApplication);
};

export const bulkDeleteApplications = async (ids: string[], options?: any) => {
  return await Application.destroy({
    where: { id: ids },
    ...options
  });
};

export const getApplicationGroups = async () => {
  const groups = await AppGroup.findAll();
  return groups.map((g: any) => {
    const json = g.toJSON ? g.toJSON() : { ...g };
    json._id = json.id;
    return json;
  });
};

export const getApplicationRoles = async () => {
  const roles = await AppRole.findAll();
  return roles.map((r: any) => {
    const json = r.toJSON ? r.toJSON() : { ...r };
    json._id = json.id;
    return json;
  });
};
