import GxpServiceEnvironmentModel from "../models/gxp-service-environments.model";

export const createEnvironment = async (data: any) => {
  return await GxpServiceEnvironmentModel.create(data);
};

export const findAllEnvironments = async () => {
  return await GxpServiceEnvironmentModel.find();
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
