import { EnvironmentModel } from "../models/gxp-service-environments.model";

export const createEnvironment = async (data: any) => {
  return await EnvironmentModel.create(data);
};

export const findAllEnvironments = async () => {
  return await EnvironmentModel.find();
};

export const findEnvironmentByName = async (environmentName: string) => {
  return await EnvironmentModel.findOne({ environmentName });
};

export const updateEnvironmentByName = async (
  environmentName: string,
  data: any
) => {
  return await EnvironmentModel.findOneAndUpdate({ environmentName }, data, {
    new: true
  });
};

export const disableEnvironmentByName = async (environmentName: string) => {
  return await EnvironmentModel.findOneAndUpdate(
    { environmentName },
    { isActive: false },
    { new: true }
  );
};

export const enableEnvironmentByName = async (environmentName: string) => {
  return await EnvironmentModel.findOneAndUpdate(
    { environmentName },
    { isActive: true },
    { new: true }
  );
};

export const searchEnvironmentsByName = async (searchTerm: string) => {
  return await EnvironmentModel.find({
    environmentName: new RegExp(searchTerm, "i")
  });
};
