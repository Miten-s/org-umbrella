import { PaginationOptions, escapeRegex } from "../utils/pagination.util";
import {
  GxpServiceAppModuleModel,
  type IGxpServiceAppModule
} from "../models/gxp-service-application-modules.model";

const moduleApplicationPopulate = {
  path: "application",
  select: "applicationName"
} as const;

export const createApplicationModule = async (
  payload: Partial<IGxpServiceAppModule>,
  currentUser: string
) => {
  const doc = new GxpServiceAppModuleModel({
    ...payload,
    createdBy: currentUser
  });
  const saved = await doc.save();
  return await saved.populate(moduleApplicationPopulate);
};


export const getApplicationModules = async (
  filter: any = {},
  options: PaginationOptions
) => {
  const { page = 1, limit = 10, skip = 0, search } = options;
  if (search) {
    const sanitizedSearch = escapeRegex(search);
    if (!filter.$or) filter.$or = [];
    filter.$or.push(
      { moduleName: { $regex: sanitizedSearch, $options: "i" } }
    );
  }
  const [data, totalCount] = await Promise.all([
    GxpServiceAppModuleModel.find(filter)
      .populate(moduleApplicationPopulate)
      .skip(skip)
      .limit(limit)
      .lean(),
    GxpServiceAppModuleModel.countDocuments(filter).exec()
  ]);
  return {
    data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const findApplicationModulesById = async (id: string) => {
  return await GxpServiceAppModuleModel.findById(id).populate(
    moduleApplicationPopulate
  );
};

export const updateApplicationModule = async (
  id: string,
  updates: Partial<IGxpServiceAppModule>
) => {
  return await GxpServiceAppModuleModel.findByIdAndUpdate(id, updates, {
    new: true
  }).populate(moduleApplicationPopulate);
};

export const deleteApplcationModule = async (id: string) => {
  return await GxpServiceAppModuleModel.findByIdAndDelete(id);
};
