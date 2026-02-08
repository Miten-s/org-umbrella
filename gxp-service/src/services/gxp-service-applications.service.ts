import * as repo from "../repo/gxp-service-applications.repo";
import GxpServiceAppGroupModel from "../models/gxp-service-application-groups.model";
import { GxpServiceAppModuleModel } from "../models/gxp-service-application-modules.model";
import { UpdateApplication } from "../types/common.types";
import GxpServiceAppAttachmentModel from "../models/gxp-service-application-attachments.model";
import mongoose from "mongoose";
import {
  fetchDepartmentsFromAuthService,
  fetchLocationsFromAuthService
} from "./inter-service-calls.service";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model";

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

    delete toSave.applicationGroups;
    delete toSave.applicationModules;

    const exisitingApplication = await repo.getApplications({
      applicationName: payload.applicationName
    });

    if (exisitingApplication.length > 0) {
      throw new Error("Application with the same name already exists");
    }

    const application = await repo.createApplication(toSave, session);

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
  delete modified.applicationGroups;
  delete modified.applicationModules;

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
  const serviceRequestsCount = await GxpServiceRequestModel.countDocuments({
    application: id
  });

  if (serviceRequestsCount > 0) {
    throw new Error(
      "Cannot delete Application. It is attached to Service Requests."
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Delete associated groups
    await GxpServiceAppGroupModel.deleteMany({ appId: id }, { session });

    // Delete associated attachments
    await GxpServiceAppAttachmentModel.deleteMany({ appId: id }, { session });

    // Delete the application itself
    const deleted = await repo.deleteApplcation(id, session);

    await session.commitTransaction();
    return deleted;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

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
    const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

    const similarApps = await repo.getApplications({
      applicationName: { $regex: regex }
    });

    let maxIndex = 0;
    similarApps.forEach((app) => {
      const match = app.applicationName.match(regex);
      if (match && match[1]) {
        const index = parseInt(match[1], 10);
        if (index > maxIndex) maxIndex = index;
      }
    });

    const newName = `${baseName}-(${maxIndex + 1})`;

    const now = new Date();
    const toSave: any = {
      ...sourceApp,
      _id: new mongoose.Types.ObjectId(),
      applicationName: newName,
      createdOn: now,
      createdBy: currentUser ?? null,
      modifiedOn: now,
      modifiedBy: currentUser ?? null,
      status: "enabled",
      attachments: [],
      applicationGroups: []
    };

    delete toSave.__v;
    delete toSave.createdAt;
    delete toSave.updatedAt;

    const newApp = await repo.createApplication(toSave, session);

    if (sourceApp.applicationGroups && sourceApp.applicationGroups.length > 0) {
      const sourceGroups = await GxpServiceAppGroupModel.find({
        _id: { $in: sourceApp.applicationGroups }
      });

      const newGroupsDocs = sourceGroups.map((group) => ({
        insertOne: {
          document: {
            appId: (newApp as any)._id.toString(),
            appGroup: group.appGroup,
            active: group.active,
            createdBy: currentUser ?? null
          }
        }
      }));

      if (newGroupsDocs.length > 0) {
        const groupResult = await GxpServiceAppGroupModel.bulkWrite(
          newGroupsDocs,
          { session }
        );
        newApp.applicationGroups = Object.values(
          groupResult?.insertedIds ?? {}
        ).map(String);
      }
    }

    if (sourceApp.attachments && sourceApp.attachments.length > 0) {
      const sourceAttachments = await GxpServiceAppAttachmentModel.find({
        _id: { $in: sourceApp.attachments }
      });

      const newAttachmentDocs = sourceAttachments.map((att) => ({
        appId: (newApp as any)._id.toString(),
        attachment: att.attachment,
        active: true,
        createdBy: currentUser ?? null
      }));

      if (newAttachmentDocs.length > 0) {
        const attachmentOps = newAttachmentDocs.map((doc) => ({
          insertOne: { document: doc }
        }));

        const result = await GxpServiceAppAttachmentModel.bulkWrite(
          attachmentOps,
          { session }
        );

        newApp.attachments = Object.values(result?.insertedIds ?? {}).map(
          String
        );
      }
    }

    if (sourceApp.applicationModules) {
      newApp.applicationModules = sourceApp.applicationModules;
    }

    await newApp.save({ session });
    await session.commitTransaction();

    return newApp;
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
