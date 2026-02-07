import * as repo from "../repo/gxp-service-applications.repo";
import GxpServiceAppGroupModel from "../models/gxp-service-application-groups.model";
import { GxpServiceAppModuleModel } from "../models/gxp-service-application-modules.model";
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

type ResolveIdsOptions = {
  model: mongoose.Model<any>;
  nameField: string;
  nameKeys: string[];
  createExtra?: Record<string, unknown>;
  queryExtra?: Record<string, unknown>;
  session?: mongoose.ClientSession;
};

/**
 * Handles mixed inputs (ObjectIds, names, or objects with _id/name fields).
 * Reuses existing records by resolving IDs from the database.
 * Creates missing records for new names using bulkWrite.
 * Returns a de-duplicated list of resolved ObjectId strings.
 */
const resolveIds = async (
  rawValues: unknown,
  options: ResolveIdsOptions
): Promise<string[] | undefined> => {
  if (!Array.isArray(rawValues)) return undefined;

  const ids: string[] = [];
  const names: string[] = [];

  for (const item of rawValues) {
    if (!item) continue;
    if (typeof item === "string") {
      if (mongoose.isValidObjectId(item)) {
        ids.push(item);
      } else {
        names.push(item.trim());
      }
      continue;
    }

    if (typeof item === "object") {
      const asRecord = item as Record<string, unknown> & { _id?: string };
      if (asRecord._id) {
        ids.push(String(asRecord._id));
        continue;
      }

      for (const key of options.nameKeys) {
        const val = asRecord[key];
        if (typeof val === "string" && val.trim()) {
          names.push(val.trim());
          break;
        }
      }
    }
  }

  const cleanedNames = Array.from(new Set(names.filter(Boolean)));
  if (cleanedNames.length) {
    const queryFilter = {
      ...(options.queryExtra ?? {}),
      [options.nameField]: { $in: cleanedNames }
    };

    let query = options.model.find(queryFilter);
    if (options.session) {
      query = query.session(options.session);
    }
    const existing = await query.lean();

    const existingNameSet = new Set(
      existing.map((doc: Record<string, any>) => doc[options.nameField])
    );
    ids.push(...existing.map((doc: Record<string, any>) => String(doc._id)));

    const toCreate = cleanedNames.filter((name) => !existingNameSet.has(name));
    if (toCreate.length) {
      const inserts = toCreate.map((name) => ({
        insertOne: {
          document: {
            [options.nameField]: name,
            ...(options.createExtra ?? {})
          }
        }
      }));

      const result = await options.model.bulkWrite(inserts, {
        session: options.session
      });

      ids.push(...Object.values(result?.insertedIds ?? {}).map(String));
    }
  }

  return Array.from(new Set(ids));
};

const getIdString = (doc: { _id?: unknown }) => {
  const rawId = doc?._id;
  if (rawId && typeof (rawId as any).toString === "function") {
    return (rawId as any).toString();
  }
  return String(rawId ?? "");
};

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

    const serviceTypeIds = await resolveIds(payload.applicationServiceRequestTypes, {
      model: GxpServiceAppServiceModel,
      nameField: "service",
      nameKeys: ["name", "service"],
      session
    });
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

    const moduleIds = await resolveIds(payload.applicationModules, {
      model: GxpServiceAppModuleModel,
      nameField: "moduleName",
      nameKeys: ["name", "moduleName"],
      session
    });
    if (moduleIds) {
      application.applicationModules = moduleIds;
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

  const serviceTypeIds = await resolveIds(updates.applicationServiceRequestTypes, {
    model: GxpServiceAppServiceModel,
    nameField: "service",
    nameKeys: ["name", "service"]
  });
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

  const moduleIds = await resolveIds(updates.applicationModules, {
    model: GxpServiceAppModuleModel,
    nameField: "moduleName",
    nameKeys: ["name", "moduleName"]
  });
  if (moduleIds) {
    modified.applicationModules = moduleIds;
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

    const baseName = sourceApp.applicationName;
    const regex = new RegExp(
      `^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\((\\d+)\\)$`
    );

    const similarApps = await repo.getApplications({
      applicationName: { $regex: regex }
    });

    let maxIndex = 0;
    similarApps.forEach((app) => {
      const match = app.applicationName.match(regex);
      if (match) {
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
        const createdAttachments = await GxpServiceAppAttachmentModel.create(
          newAttachmentDocs,
          { session }
        );
        newApp.attachments = createdAttachments.map((doc) =>
          doc._id.toString()
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