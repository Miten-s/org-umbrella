import * as repo from "../repo/gxp-service-applications.repo";
import GxpServiceRolesModel from "../models/gxp-service-application-roles.model";
import GxpServiceAppGroupModel from "../models/gxp-service-application-groups.model";
import { GxpServiceAppModuleModel } from "../models/gxp-service-application-modules.model";
import { UpdateApplication } from "../types/common.types";
import GxpServiceAppAttachmentModel from "../models/gxp-service-application-attachments.model";
import mongoose from "mongoose";
import {
  fetchDepartmentsFromAuthService,
  fetchLocationsFromAuthService
} from "./inter-service-calls.service";

export const createApplication = async (
  payload: UpdateApplication,
  currentUser?: string,
  attachments?: string[]
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const now = new Date();

    const toSave = {
      ...JSON.parse(
        JSON.stringify({
          ...payload,
          createdOn: now,
          createdBy: currentUser ?? null,
          modifiedOn: now,
          modifiedBy: currentUser ?? null,
          status: "enabled"
        })
      ),
      modifiedOn: new Date(),
      modifiedBy: currentUser ?? null
    };

    delete toSave.applicationRoles;
    delete toSave.applicationGroups;
    delete toSave.applicationModules;

    const exisitingApplication = await repo.getApplications({
      applicationName: payload.applicationName
    });

    if (exisitingApplication.length > 0) {
      throw new Error("Application with the same name already exists");
    }

    const application = await repo.createApplication(toSave, session);

    if (payload.applicationRoles) {
      const roles = payload.applicationRoles
        .filter((role) => !role._id)
        .map((role) => ({
          insertOne: { document: { role: role.name, appId: application._id } }
        }));

      const result = await GxpServiceRolesModel.bulkWrite(roles, { session });
      application.applicationRoles = [
        ...Object.values(result?.insertedIds ?? {}).map(String),
        ...payload.applicationRoles
          .filter((role) => role._id)
          .map((role) => role._id)
      ];
    }

    // Update application group from payload

    if (payload.applicationGroups) {
      const groups = payload.applicationGroups
        .filter((group) => !group._id)
        .map((group) => ({
          insertOne: {
            document: { appGroup: group.name, appId: application._id }
          }
        }));

      const result = await GxpServiceAppGroupModel.bulkWrite(groups, {
        session
      });
      application.applicationGroups = [
        ...Object.values(result?.insertedIds ?? {}).map(String),
        ...payload.applicationGroups
          .filter((group) => group._id)
          .map((group) => group._id)
      ];
    }

    // Update application modules from payload

    if (payload.applicationModules) {
      const modules = payload.applicationModules
        .filter((mod) => !mod?._id)
        .map((mod) => ({
          insertOne: { document: { moduleName: mod.name } }
        }));

      const result = await GxpServiceAppModuleModel.bulkWrite(modules, {
        session
      });
      application.applicationModules = [
        ...Object.values(result?.insertedIds ?? {}).map(String),
        ...payload.applicationModules
          .filter((mod) => mod?._id)
          .map((mod) => mod?._id)
      ];
    }

    if (attachments?.length) {
      const createdAttachments = await Promise.all(
        attachments.map((attachment) =>
          GxpServiceAppAttachmentModel.create(
            [
              {
                appId: application._id,
                attachment,
                active: true,
                createdBy: currentUser ?? null
              }
            ],
            { session }
          )
        )
      );

      application.attachments = createdAttachments.map((doc) =>
        doc[0]._id.toString()
      );
    }

    await application.save({ session });
    await session.commitTransaction();

    return application;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getApplications = async (includeDisabled = false) => {
  const filter: any = {};
  if (!includeDisabled) filter.status = "enabled";
  return await repo.getApplications(filter);
};

export const getApplicationById = async (id: string) => {
  const applicaton = await repo.findApplicationById(id);
  return {
    ...applicaton,
    departments: applicaton?.departments
      ? await fetchDepartmentsFromAuthService([...applicaton?.departments])
      : null,
    group: applicaton?.group
      ? (await fetchLocationsFromAuthService([applicaton?.group]))[0]
      : null
  };
};

export const updateApplication = async (
  id: string,
  updates: UpdateApplication,
  currentUser?: string,
  attachments?: string[]
) => {
  const isApplicationExist = await repo.findApplicationById(id);

  if (!isApplicationExist) {
    throw new Error("Application not found");
  }

  const modified = {
    ...JSON.parse(JSON.stringify(updates)),
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  };

  delete modified.applicationName;
  delete modified.applicationRoles;
  delete modified.applicationGroups;
  delete modified.applicationModules;
  delete modified.departments;

  // Update application roles from payload

  if (updates.applicationRoles) {
    const roles = updates.applicationRoles
      .filter((role) => !role._id)
      .map((role) => ({
        insertOne: { document: { role: role.name, appId: id } }
      }));

    const result = await GxpServiceRolesModel.bulkWrite(roles);
    modified.applicationRoles = [
      ...Object.values(result?.insertedIds ?? {}).map(String),
      ...updates.applicationRoles
        .filter((role) => role._id)
        .map((role) => role._id)
    ];
  }

  // Update application group from payload

  if (updates.applicationGroups) {
    const groups = updates.applicationGroups
      .filter((group) => !group._id)
      .map((group) => ({
        insertOne: { document: { appGroup: group.name, appId: id } }
      }));

    const result = await GxpServiceAppGroupModel.bulkWrite(groups);
    modified.applicationGroups = [
      ...Object.values(result?.insertedIds ?? {}).map(String),
      ...updates.applicationGroups
        .filter((group) => group._id)
        .map((group) => group._id)
    ];
  }

  // Update application modules from payload

  if (updates.applicationModules) {
    const modules = updates.applicationModules
      .filter((mod) => !mod?._id)
      .map((mod) => ({
        insertOne: { document: { moduleName: mod.name } }
      }));

    const result = await GxpServiceAppModuleModel.bulkWrite(modules);
    modified.applicationModules = [
      ...Object.values(result?.insertedIds ?? {}).map(String),
      ...updates.applicationModules
        .filter((mod) => mod?._id)
        .map((mod) => mod?._id)
    ];
  }

  if (attachments?.length) {
    const createdAttachments = await Promise.all(
      attachments.map((attachment) =>
        GxpServiceAppAttachmentModel.create({
          appId: id,
          attachment,
          active: true,
          createdBy: currentUser ?? null
        })
      )
    );

    modified.attachments = [
      ...new Set([
        ...(updates?.attachments ?? []),
        ...createdAttachments.map((doc) => doc._id.toString())
      ])
    ];
  }

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

export const deleteAttachments = async (id: string) => {
  return await repo.deleteAttachments(id);
};

export const getApplicationGroups = async () => {
  return await repo.getApplicationGroups();
};
