import * as repo from "../repo/gxp-service-applications.repo";
import { IApplication } from "../models/gxp-service-applications.model";
import GxpServiceRolesModel from "../models/gxp-service-application-roles.model";
import GxpServiceAppGroupModel from "../models/gxp-service-application-groups.model";
import GxpServiceAppServiceModel from "../models/gxp-service-application-services.model";
import GxpServiceAppDepartmentModel from "../models/gxp-service-application-departments.model";
import { GxpServiceAppModuleModel } from "../models/gxp-service-application-modules.model";

export const createApplication = async (
  payload: Partial<IApplication>,
  currentUser?: string
) => {
  const now = new Date();
  const toSave: Partial<IApplication> = {
    ...payload,
    attachments: [],
    createdOn: now,
    createdBy: currentUser ?? null,
    modifiedOn: now,
    modifiedBy: currentUser ?? null,
    status: "enabled"
  };

  delete toSave.applicationRoles;
  delete toSave.applicationGroups;
  delete toSave.applicationServiceRequestTypes;
  delete toSave.applicationModules;
  delete toSave.departments;

  const application = await repo.createApplication(toSave);

  // Create application roles from payload

  if (payload.applicationRoles) {
    const roles = payload.applicationRoles.map((name) => ({
      insertOne: { document: { role: name, appId: application._id } }
    }));

    const result = await GxpServiceRolesModel.bulkWrite(roles);
    application.applicationRoles = Object.values(result?.insertedIds ?? {});
  }

  // Create application group from payload

  if (payload.applicationGroups) {
    const groups = payload.applicationGroups.map((name) => ({
      insertOne: { document: { appGroup: name, appId: application._id } }
    }));

    const result = await GxpServiceAppGroupModel.bulkWrite(groups);
    application.applicationGroups = Object.values(result?.insertedIds ?? {});
  }

  // Create application service requests from payload

  if (payload.applicationServiceRequestTypes) {
    const groups = payload.applicationServiceRequestTypes.map((name) => ({
      insertOne: { document: { service: name, appId: application._id } }
    }));

    const result = await GxpServiceAppServiceModel.bulkWrite(groups);
    application.applicationServiceRequestTypes = Object.values(
      result?.insertedIds ?? {}
    );
  }

  // Create application modules from payload

  if (payload.applicationModules) {
    const modules = payload.applicationModules.map((name) => ({
      insertOne: { document: { moduleName: name } }
    }));

    const result = await GxpServiceAppModuleModel.bulkWrite(modules);
    application.applicationModules = Object.values(result?.insertedIds ?? {});
  }

  // Create application departments from payload

  if (payload.departments) {
    const modules = payload.departments.map((name) => ({
      insertOne: {
        document: { departmentName: name, appId: application._id }
      }
    }));

    const result = await GxpServiceAppDepartmentModel.bulkWrite(modules);
    application.departments = Object.values(result?.insertedIds ?? {});
  }

  application.save();

  return application;
};

export const getApplications = async (includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";
  return await repo.getApplications(filter);
};

export const getApplicationById = async (id: string) => {
  return await repo.findApplicationById(id);
};

export const updateApplication = async (
  id: string,
  updates: Partial<IApplication>,
  currentUser?: string
) => {
  const modified = {
    ...updates,
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  };
  return await repo.updateApplication(id, modified);
};

export const disableApplication = async (id: string, currentUser?: string) => {
  await repo.updateApplication(id, {
    status: "disabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  });
  return await repo.disableApplication(id);
};

export const enableApplication = async (id: string, currentUser?: string) => {
  await repo.updateApplication(id, {
    status: "enabled",
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  });
  return await repo.enableApplication(id);
};

export const deleteApplication = async (id: string) => {
  return await repo.deleteApplcation(id);
};
