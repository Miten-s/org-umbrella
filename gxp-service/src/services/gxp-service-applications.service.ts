import * as repo from "../repo/gxp-service-applications.repo";
import GxpServiceAppGroupModel from "../models/gxp-service-application-groups.model";
import GxpServiceAppRoleModel from "../models/gxp-service-application-roles.model";
import GxpServiceAppServiceModel from "../models/gxp-service-application-services.model";
import { UpdateApplication } from "../types/common.types";
import GxpServiceAppAttachmentModel from "../models/gxp-service-application-attachments.model";
import mongoose from "mongoose";
import {
  fetchDepartmentsFromAuthService,
  fetchLocationsFromAuthService
} from "./inter-service-calls.service";
import { GxpServiceRequestModel } from "../models/gxp-service-service-requests.model";
import {
  resolveModuleIdsForApplication,
  syncModuleOwnership
} from "./application-module-linking.service";
import {
  resolveIds,
  toObjectIdString
} from "./mixed-id-resolution.service";

const getIdString = (doc: { _id?: unknown }) => {
  const rawId = doc?._id;
  if (rawId && typeof (rawId as any).toString === "function") {
    return (rawId as any).toString();
  }
  return String(rawId ?? "");
};

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

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
  if (!OBJECT_ID_REGEX.test(raw)) return raw;

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

    const locationName = await resolveLocationNameFromGroup(payload.group);
    toSave.applicationId = buildApplicationId(
      payload.applicationName,
      payload.applicationType,
      locationName
    );

    const serviceTypeIds = await resolveIds(
      payload.applicationServiceRequestTypes,
      {
        model: GxpServiceAppServiceModel,
        nameField: "service",
        nameKeys: ["name", "service"],
        session
      }
    );
    if (serviceTypeIds) {
      toSave.applicationServiceRequestTypes = serviceTypeIds;
    }

    const roleIds = await resolveIds(payload.applicationRoles, {
      model: GxpServiceAppRoleModel,
      nameField: "role",
      nameKeys: ["name", "role"],
      session
    });
    delete toSave.applicationGroups;
    delete toSave.applicationModules;

    if (roleIds) {
      toSave.applicationRoles = roleIds;
    }

    const exisitingApplication = await repo.getApplications({
      applicationName: payload.applicationName
    });

    if (exisitingApplication.length > 0) {
      throw new Error("Application with the same name already exists");
    }

    const application = await repo.createApplication(toSave, session);

    const applicationId = getIdString(application);
    const groupIds = await resolveIds(payload.applicationGroups, {
      model: GxpServiceAppGroupModel,
      nameField: "appGroup",
      nameKeys: ["name", "appGroup"],
      createExtra: { appId: applicationId },
      queryExtra: { appId: applicationId },
      session
    });
    if (groupIds) {
      application.applicationGroups = groupIds;
    }

    // Module resolution and ownership sync are centralized to keep application service orchestration-focused.
    const moduleIds = await resolveModuleIdsForApplication(
      payload.applicationModules,
      applicationId,
      session
    );
    if (moduleIds) {
      application.applicationModules = moduleIds;
      await syncModuleOwnership(applicationId, moduleIds, [], session);
    }

    if (attachments?.length) {
      const createdAttachments = await Promise.all(
        attachments.map((attachment) =>
          GxpServiceAppAttachmentModel.create(
            [
              {
                appId: applicationId,
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
  const application = (await repo.findApplicationById(id)) as any;
  if (!application) return null;

  return {
    ...application,
    departments: application.departments
      ? await fetchDepartmentsFromAuthService([...application.departments])
      : null,
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
  const isApplicationExist = (await repo.findApplicationById(id)) as any;

  if (!isApplicationExist) {
    throw new Error("Application not found");
  }

  const nextApplicationName = String(
    updates.applicationName ?? isApplicationExist.applicationName ?? ""
  ).trim();
  if (!nextApplicationName) {
    throw new Error("Application name is required");
  }

  const currentApplicationName = String(
    isApplicationExist.applicationName ?? ""
  ).trim();

  if (nextApplicationName !== currentApplicationName) {
    const isNameTaken = await repo.isApplicationNameTaken(nextApplicationName, id);
    if (isNameTaken) {
      throw new Error("Application name must be unique");
    }
  }

  const existingModuleIds = (isApplicationExist.applicationModules ?? [])
    .map((moduleRef: unknown) =>
      toObjectIdString(
        moduleRef && typeof moduleRef === "object"
          ? (moduleRef as Record<string, unknown>)._id ?? moduleRef
          : moduleRef
      )
    )
    .filter((moduleId: string | undefined): moduleId is string => Boolean(moduleId));
  const modified = {
    ...JSON.parse(JSON.stringify(updates)),
    modifiedOn: new Date(),
    modifiedBy: currentUser ?? null
  };

  modified.applicationName = nextApplicationName;

  const locationName = await resolveLocationNameFromGroup(
    updates.group ?? isApplicationExist.group
  );
  modified.applicationId = buildApplicationId(
    nextApplicationName,
    updates.applicationType ?? isApplicationExist.applicationType,
    locationName
  );
  delete modified.applicationGroups;
  delete modified.applicationModules;

  const serviceTypeIds = await resolveIds(
    updates.applicationServiceRequestTypes,
    {
      model: GxpServiceAppServiceModel,
      nameField: "service",
      nameKeys: ["name", "service"]
    }
  );
  if (serviceTypeIds) {
    modified.applicationServiceRequestTypes = serviceTypeIds;
  }

  const roleIds = await resolveIds(updates.applicationRoles, {
    model: GxpServiceAppRoleModel,
    nameField: "role",
    nameKeys: ["name", "role"]
  });
  if (roleIds) {
    modified.applicationRoles = roleIds;
  }

  const groupIds = await resolveIds(updates.applicationGroups, {
    model: GxpServiceAppGroupModel,
    nameField: "appGroup",
    nameKeys: ["name", "appGroup"],
    createExtra: { appId: id },
    queryExtra: { appId: id }
  });
  if (groupIds) {
    modified.applicationGroups = groupIds;
  }

  // Reuse shared module-linking rules for update as well, so create/update stay consistent.
  const moduleIds = await resolveModuleIdsForApplication(updates.applicationModules, id);
  if (moduleIds) {
    modified.applicationModules = moduleIds;
    await syncModuleOwnership(id, moduleIds, existingModuleIds);
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

  try {
    return await repo.updateApplication(id, modified);
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.applicationName) {
      throw new Error("Application name must be unique");
    }
    throw error;
  }
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

export const getApplicationRoles = async () => {
  return await repo.getApplicationRoles();
};
