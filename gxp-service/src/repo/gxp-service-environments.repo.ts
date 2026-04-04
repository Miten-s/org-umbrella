import GxpServiceEnvironmentModel from "../models/gxp-service-environments.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

export const createEnvironment = async (data: any) => {
  return await GxpServiceEnvironmentModel.create(data);
};


export const findAllEnvironments = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const filter: any = {};
  if (search) {
    const sanitizedSearch = escapeRegex(search);
    filter.$or = [
      { environmentName: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    ];
  }
  const [data, totalCount] = await Promise.all([
    GxpServiceEnvironmentModel.find(filter).skip(skip).limit(limit).lean(),
    GxpServiceEnvironmentModel.countDocuments(filter).exec()
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

export const findEnvironment = async (_id: string) => {
  return await GxpServiceEnvironmentModel.findOne({ _id });
};

export const updateEnvironment = async (_id: string, data: any) => {
  return await GxpServiceEnvironmentModel.findOneAndUpdate({ _id }, data, {
    new: true
  });
};

export const disableEnvironment = async (_id: string) => {
  return await GxpServiceEnvironmentModel.findOneAndUpdate(
    { _id },
    { isActive: false },
    { new: true }
  );
};

export const enableEnvironment = async (_id: string) => {
  return await GxpServiceEnvironmentModel.findOneAndUpdate(
    { _id },
    { isActive: true },
    { new: true }
  );
};
