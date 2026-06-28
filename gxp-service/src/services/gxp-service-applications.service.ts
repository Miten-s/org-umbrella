import * as repo from "../repo/gxp-service-applications.repo";
import AppGroup from "../models/gxp-service-application-groups.model";
import AppDepartment from "../models/gxp-service-application-departments.model";
import AppRole from "../models/gxp-service-application-roles.model";
import AppService from "../models/gxp-service-application-services.model";
import { UpdateApplication } from "../types/common.types";
import AppAttachment from "../models/gxp-service-application-attachments.model";
import AppModule from "../models/gxp-service-application-modules.model";
import Workflow from "../models/gxp-service-workflows.model";
import Supplier from "../models/gxp-service-suppliers.model";
import Environment from "../models/gxp-service-environments.model";
import Application from "../models/gxp-service-applications.model";
import {
  fetchDepartmentsFromAuthService,
  fetchLocationsFromAuthService
} from "./inter-service-calls.service";
import ServiceRequest from "../models/gxp-service-service-requests.model";
import {
  resolveModuleIdsForApplication,
  syncModuleOwnership
} from "./application-module-linking.service";
import { PaginationOptions } from "../utils/pagination.util";
import {
  resolveIds,
  toObjectIdString
} from "./mixed-id-resolution.service";
import { sequelize } from "../configs/db.sequelize";
import { Op } from "sequelize";
import crypto from "crypto";

const getIdString = (doc: any) => {
  return doc?.id || "";
};

const normalizeApplicationIdSegment = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const resolveLocationNameFromGroup = async (group: unknown): Promise<string> => {
  const raw = String(group ?? "").trim();
  if (!raw) return "";
  if (raw.length !== 36) return raw;

  try {
    const locations = await fetchLocationsFromAuthService([raw]);
    const locationName = locations?.[0]?.locationName;
    return String(locationName ?? raw).trim() || raw;
  } catch {
    return raw;
  }
};

const buildApplicationId = (
  applicationName: unknown,
  applicationType: unknown,
  locationName: unknown
): string =>
  [
    normalizeApplicationIdSegment(applicationName),
    normalizeApplicationIdSegment(applicationType),
    normalizeApplicationIdSegment(locationName)
  ]
    .filter(Boolean)
    .join("-");

const normalizeServiceRequestIdAppSegment = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const renameServiceRequestIdentitiesForApplication = async (
  applicationId: string,
  nextApplicationName: string
) => {
  const nextSegment = normalizeServiceRequestIdAppSegment(nextApplicationName);
  if (!nextSegment) return;

  const nextPrefix = `SR_${nextSegment}_`;
  const relatedRequests = await ServiceRequest.findAll({
    where: { applicationId },
    attributes: ["id", "serviceRequestId"]
  });

  if (!relatedRequests.length) return;

  const renameTargets = relatedRequests
    .map((request, index) => {
      const currentServiceRequestId = String(request.serviceRequestId ?? "");
      const fallbackSequence = String(index + 1).padStart(4, "0");
      const rawSequence = currentServiceRequestId.split("_").pop() ?? "";
      const sequencePart = /^\d+$/.test(rawSequence)
        ? rawSequence
        : fallbackSequence;

      return {
        _id: String(request.id ?? ""),
        nextServiceRequestId: `${nextPrefix}${sequencePart}`
      };
    })
    .filter(
      (
        target
      ): target is {
        _id: string;
        nextServiceRequestId: string;
      } => Boolean(target?._id && target?.nextServiceRequestId)
    );

  if (!renameTargets.length) return;

  const conflictingRequest = await ServiceRequest.findOne({
    where: {
      id: { [Op.notIn]: renameTargets.map((target) => target._id) },
      serviceRequestId: { [Op.in]: renameTargets.map((target) => target.nextServiceRequestId) }
    },
    attributes: ["id"]
  });

  if (conflictingRequest) {
    throw new Error(
      "Unable to rename related service request identities due to existing duplicates"
    );
  }

  for (const target of renameTargets) {
    await ServiceRequest.update(
      { serviceRequestId: target.nextServiceRequestId },
      { where: { id: target._id } }
    );
  }
};

export const createApplication = async (
  payload: UpdateApplication,
  currentUser?: string,
  attachments?: string[]
) => {
  const t = await sequelize.transaction();
  try {
    const now = new Date();

    const toSave: any = {
      applicationName: payload.applicationName,
      applicationType: payload.applicationType,
      applicationEnvironmentId: payload.applicationEnvironmentId || payload.applicationEnvironment || null,
      group: payload.group,
      assignmentGroupId: payload.assignmentGroupId || payload.assignmentGroup || null,
      applicationWorkflowId: payload.applicationWorkflowId || payload.applicationWorkflow || null,
      applicationSystemOwnerId: payload.applicationSystemOwnerId || payload.applicationSystemOwner || null,
      applicationProcessOwnerId: payload.applicationProcessOwnerId || payload.applicationProcessOwner || null,
      supplierId: payload.supplierId || payload.supplier || null,
      notes: payload.notes,
      createdOn: now,
      createdBy: currentUser ?? null,
      modifiedOn: now,
      modifiedBy: currentUser ?? null,
      status: "enabled"
    };

    const locationName = await resolveLocationNameFromGroup(payload.group);
    toSave.applicationId = buildApplicationId(
      payload.applicationName,
      payload.applicationType,
      locationName
    );

    const serviceTypeIds = await resolveIds(
      payload.applicationServiceRequestTypes,
      {
        model: AppService,
        nameField: "service",
        nameKeys: ["name", "service"],
        transaction: t
      }
    );

    const roleIds = await resolveIds(payload.applicationRoles, {
      model: AppRole,
      nameField: "role",
      nameKeys: ["name", "role"],
      transaction: t
    });

    const exisitingApplicationResult = await repo.getApplications({
      applicationName: payload.applicationName
    });

    if (exisitingApplicationResult.data.length > 0) {
      throw new Error("Application with the same name already exists");
    }

    const applicationDoc = await Application.create(toSave, { transaction: t });
    const applicationId = applicationDoc.id;

    if (roleIds) {
      await (applicationDoc as any).setApplicationRoles(roleIds, { transaction: t });
    }

    if (serviceTypeIds) {
      await (applicationDoc as any).setApplicationServiceRequestTypes(serviceTypeIds, { transaction: t });
    }

    if (payload.applicationGroups) {
      const groupIds = await resolveIds(payload.applicationGroups, {
        model: AppGroup,
        nameField: "appGroup",
        nameKeys: ["name", "appGroup"],
        createExtra: { applicationId },
        queryExtra: { applicationId },
        transaction: t
      });
      if (groupIds) {
        await AppGroup.update(
          { applicationId },
          { where: { id: groupIds }, transaction: t }
        );
      }
    }

    if (payload.departments && Array.isArray(payload.departments)) {
      await Promise.all(
        payload.departments.map((deptId) =>
          AppDepartment.create(
            {
              id: crypto.randomUUID(),
              applicationId,
              departmentName: deptId,
              active: true
            },
            { transaction: t }
          )
        )
      );
    }

    const moduleIds = await resolveModuleIdsForApplication(
      payload.applicationModules,
      applicationId,
      t
    );
    if (moduleIds) {
      await syncModuleOwnership(applicationId, moduleIds, [], t);
    }

    if (attachments?.length) {
      await Promise.all(
        attachments.map((attachment) =>
          AppAttachment.create(
            {
              applicationId,
              attachment,
              active: true,
              createdBy: currentUser || undefined
            },
            { transaction: t }
          )
        )
      );
    }

    await t.commit();

    return await repo.findApplicationById(applicationId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const getApplications = async (options: PaginationOptions, includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";
  return await repo.getApplications(filter, options);
};

export const getApplicationById = async (id: string) => {
  const application = await repo.findApplicationById(id);
  if (!application) return null;

  return {
    ...application,
    departments: application.departments && application.departments.length
      ? await fetchDepartmentsFromAuthService(application.departments.map((d: any) => d.departmentName))
      : [],
    group: application.group
      ? (await fetchLocationsFromAuthService([application.group]))[0]
      : null
  };
};

export const updateApplication = async (
  id: string,
  updates: UpdateApplication,
  currentUser?: string,
  attachments?: string[]
) => {
  const isApplicationExist = await Application.findByPk(id);

  if (!isApplicationExist) {
    throw new Error("Application not found");
  }

  const nextApplicationName = String(
    updates.applicationName ?? (isApplicationExist as any).applicationName ?? ""
  ).trim();
  if (!nextApplicationName) {
    throw new Error("Application name is required");
  }

  const currentApplicationName = String(
    (isApplicationExist as any).applicationName ?? ""
  ).trim();

  const applicationNameChanged = nextApplicationName !== currentApplicationName;

  if (applicationNameChanged) {
    const isNameTaken = await repo.isApplicationNameTaken(nextApplicationName, id);
    if (isNameTaken) {
      throw new Error("Application name must be unique");
    }
  }

  const existingModules = await (isApplicationExist as any).getApplicationModules();
  const existingModuleIds = existingModules.map((m: any) => m.id);

  const t = await sequelize.transaction();
  try {
    const locationName = await resolveLocationNameFromGroup(
      updates.group ?? (isApplicationExist as any).group
    );
    const applicationIdString = buildApplicationId(
      nextApplicationName,
      updates.applicationType ?? (isApplicationExist as any).applicationType,
      locationName
    );

    const environmentId = updates.applicationEnvironmentId !== undefined 
      ? updates.applicationEnvironmentId 
      : (updates.applicationEnvironment !== undefined ? updates.applicationEnvironment : (isApplicationExist as any).applicationEnvironmentId);
      
    const assignmentGroupId = updates.assignmentGroupId !== undefined 
      ? updates.assignmentGroupId 
      : (updates.assignmentGroup !== undefined ? updates.assignmentGroup : (isApplicationExist as any).assignmentGroupId);

    const workflowId = updates.applicationWorkflowId !== undefined 
      ? updates.applicationWorkflowId 
      : (updates.applicationWorkflow !== undefined ? updates.applicationWorkflow : (isApplicationExist as any).applicationWorkflowId);

    const systemOwnerId = updates.applicationSystemOwnerId !== undefined 
      ? updates.applicationSystemOwnerId 
      : (updates.applicationSystemOwner !== undefined ? updates.applicationSystemOwner : (isApplicationExist as any).applicationSystemOwnerId);

    const processOwnerId = updates.applicationProcessOwnerId !== undefined 
      ? updates.applicationProcessOwnerId 
      : (updates.applicationProcessOwner !== undefined ? updates.applicationProcessOwner : (isApplicationExist as any).applicationProcessOwnerId);

    const supplierId = updates.supplierId !== undefined 
      ? updates.supplierId 
      : (updates.supplier !== undefined ? updates.supplier : (isApplicationExist as any).supplierId);

    await isApplicationExist.update({
      applicationName: nextApplicationName,
      applicationType: updates.applicationType ?? (isApplicationExist as any).applicationType,
      applicationEnvironmentId: environmentId,
      group: updates.group ?? (isApplicationExist as any).group,
      assignmentGroupId: assignmentGroupId,
      applicationWorkflowId: workflowId,
      applicationSystemOwnerId: systemOwnerId,
      applicationProcessOwnerId: processOwnerId,
      supplierId: supplierId,
      notes: updates.notes !== undefined ? updates.notes : (isApplicationExist as any).notes,
      applicationId: applicationIdString,
      modifiedOn: new Date(),
      modifiedBy: currentUser || undefined
    }, { transaction: t });

    if (updates.applicationRoles) {
      const roleIds = await resolveIds(updates.applicationRoles, {
        model: AppRole,
        nameField: "role",
        nameKeys: ["name", "role"],
        transaction: t
      });
      if (roleIds) {
        await (isApplicationExist as any).setApplicationRoles(roleIds, { transaction: t });
      }
    }

    if (updates.applicationServiceRequestTypes) {
      const serviceTypeIds = await resolveIds(
        updates.applicationServiceRequestTypes,
        {
          model: AppService,
          nameField: "service",
          nameKeys: ["name", "service"],
          transaction: t
        }
      );
      if (serviceTypeIds) {
        await (isApplicationExist as any).setApplicationServiceRequestTypes(serviceTypeIds, { transaction: t });
      }
    }

    if (updates.applicationGroups) {
      const groupIds = await resolveIds(updates.applicationGroups, {
        model: AppGroup,
        nameField: "appGroup",
        nameKeys: ["name", "appGroup"],
        createExtra: { applicationId: id },
        queryExtra: { applicationId: id },
        transaction: t
      });

      if (groupIds) {
        await AppGroup.update(
          { applicationId: id },
          { where: { id: groupIds }, transaction: t }
        );

        const currentGroups = await AppGroup.findAll({
          where: { applicationId: id },
          attributes: ["id"],
          transaction: t
        });
        const currentGroupIds = currentGroups.map((g: any) => g.id);
        const removedGroupIds = currentGroupIds.filter(
          (gid) => !groupIds.includes(gid)
        );
        if (removedGroupIds.length) {
          await AppGroup.destroy({
            where: { id: removedGroupIds, applicationId: id },
            transaction: t
          });
        }
      }
    }

    if (updates.departments && Array.isArray(updates.departments)) {
      // Clear old departments
      await AppDepartment.destroy({ where: { applicationId: id }, transaction: t });
      await Promise.all(
        updates.departments.map((deptId) =>
          AppDepartment.create(
            {
              id: crypto.randomUUID(),
              applicationId: id,
              departmentName: deptId,
              active: true
            },
            { transaction: t }
          )
        )
      );
    }

    if (updates.applicationModules) {
      const moduleIds = await resolveModuleIdsForApplication(updates.applicationModules, id, t);
      if (moduleIds) {
        await syncModuleOwnership(id, moduleIds, existingModuleIds, t);
      }
    }

    if (attachments?.length) {
      await Promise.all(
        attachments.map((attachment) =>
          AppAttachment.create({
            applicationId: id,
            attachment,
            active: true,
            createdBy: currentUser || undefined
          }, { transaction: t })
        )
      );
    }

    if (applicationNameChanged) {
      await renameServiceRequestIdentitiesForApplication(id, nextApplicationName);
    }

    await t.commit();

    return await repo.findApplicationById(id);
  } catch (error: any) {
    await t.rollback();
    throw error;
  }
};

export const disableApplication = async (id: string, currentUser?: string) => {
  await Application.update({
    status: "disabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser || undefined
  }, { where: { id } });
  return await repo.disableApplication(id);
};

export const enableApplication = async (id: string, currentUser?: string) => {
  await Application.update({
    status: "enabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser || undefined
  }, { where: { id } });
  return await repo.enableApplication(id);
};

export const deleteApplication = async (id: string) => {
  const serviceRequestsCount = await ServiceRequest.count({
    where: { applicationId: id }
  });

  if (serviceRequestsCount > 0) {
    throw new Error(
      "Cannot delete Application. It is attached to Service Requests."
    );
  }

  const t = await sequelize.transaction();
  try {
    await AppGroup.destroy({ where: { applicationId: id }, transaction: t });
    await AppAttachment.destroy({ where: { applicationId: id }, transaction: t });

    const deleted = await repo.deleteApplcation(id, { transaction: t });

    await t.commit();
    return deleted;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteAttachments = async (id: string) => {
  return await repo.deleteAttachments(id);
};

export const getApplicationGroups = async () => {
  return await repo.getApplicationGroups();
};

export const duplicateApplication = async (
  id: string,
  currentUser?: string
) => {
  const t = await sequelize.transaction();
  try {
    const sourceApp = await repo.findApplicationByIdRaw(id);
    if (!sourceApp) {
      throw new Error("Application not found");
    }

    let baseName = sourceApp.applicationName;
    const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
    if (nameMatch) {
      baseName = nameMatch[1];
    }

    const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexStr = `^${escapedBaseName}(?:-\\((\\d+)\\))?$`;

    const similarAppsResult = await repo.getApplications({
      applicationName: { [Op.iRegexp]: regexStr }
    });

    let maxIndex = 0;
    similarAppsResult.data.forEach((app: any) => {
      const match = app.applicationName.match(new RegExp(regexStr, 'i'));
      if (match && match[1]) {
        const index = parseInt(match[1], 10);
        if (index > maxIndex) maxIndex = index;
      }
    });

    const newName = `${baseName}-(${maxIndex + 1})`;

    const now = new Date();
    const newAppId = crypto.randomUUID();
    const toSave: any = {
      ...sourceApp,
      id: newAppId,
      applicationName: newName,
      createdOn: now,
      createdBy: currentUser ?? null,
      modifiedOn: now,
      modifiedBy: currentUser ?? null,
      status: "enabled"
    };

    delete toSave._id;
    delete toSave.__v;
    delete toSave.createdAt;
    delete toSave.updatedAt;

    const newApp = await Application.create(toSave, { transaction: t });

    const sourceAppDoc = await Application.findByPk(id);
    if (sourceAppDoc) {
      const roles = await (sourceAppDoc as any).getApplicationRoles();
      await (newApp as any).setApplicationRoles(roles.map((r: any) => r.id), { transaction: t });

      const services = await (sourceAppDoc as any).getApplicationServiceRequestTypes();
      await (newApp as any).setApplicationServiceRequestTypes(services.map((s: any) => s.id), { transaction: t });
    }

    const sourceGroups = await AppGroup.findAll({ where: { applicationId: id } });
    if (sourceGroups.length > 0) {
      const newGroups = sourceGroups.map((group) => ({
        id: crypto.randomUUID(),
        applicationId: newAppId,
        appGroup: group.appGroup,
        active: group.active,
        createdBy: currentUser || undefined
      }));
      await AppGroup.bulkCreate(newGroups, { transaction: t });
    }

    const sourceAttachments = await AppAttachment.findAll({ where: { applicationId: id } });
    if (sourceAttachments.length > 0) {
      const newAttachments = sourceAttachments.map((att) => ({
        id: crypto.randomUUID(),
        applicationId: newAppId,
        attachment: att.attachment,
        active: true,
        createdBy: currentUser || undefined
      }));
      await AppAttachment.bulkCreate(newAttachments, { transaction: t });
    }

    const sourceModules = await (sourceAppDoc as any)?.getApplicationModules();
    if (sourceModules && sourceModules.length > 0) {
      await syncModuleOwnership(newAppId, sourceModules.map((m: any) => m.id), [], t);
    }

    await t.commit();
    return await repo.findApplicationById(newAppId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkDeleteApplications = async (ids: string[]) => {
  const serviceRequestsCount = await ServiceRequest.count({
    where: { applicationId: { [Op.in]: ids } }
  });

  if (serviceRequestsCount > 0) {
    throw new Error(
      "Cannot delete Applications. One or more are attached to Service Requests."
    );
  }

  const t = await sequelize.transaction();
  try {
    await AppGroup.destroy({ where: { applicationId: { [Op.in]: ids } }, transaction: t });
    await AppAttachment.destroy({ where: { applicationId: { [Op.in]: ids } }, transaction: t });

    const deleted = await repo.bulkDeleteApplications(ids, { transaction: t });

    await t.commit();
    return deleted;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkDuplicateApplications = async (
  ids: string[],
  currentUser?: string
) => {
  const duplicatedApps = [];
  for (const id of ids) {
    const dup = await duplicateApplication(id, currentUser);
    if (dup) duplicatedApps.push(dup);
  }
  return duplicatedApps;
};

export const getApplicationRoles = async () => {
  return await repo.getApplicationRoles();
};
