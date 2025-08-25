import {
  createEnvironment,
  findAllEnvironments,
  updateEnvironmentByName,
  disableEnvironmentByName,
  enableEnvironmentByName,
  searchEnvironmentsByName
} from "../repo/gxp-service-environments.repo";

export const addNewEnvironment = async (data: any, user: any) => {
  const environmentToCreate = {
    ...data,
    createdOn: new Date(),
    createdBy: user,
    modifiedOn: new Date(),
    modifiedBy: null,
    isActive: true
  };

  return await createEnvironment(environmentToCreate);
};

export const getAllEnvironments = async () => {
  return await findAllEnvironments();
};

export const updateEnvironment = async (
  environmentName: string,
  updatedData: any,
  user: any
) => {
  return await updateEnvironmentByName(environmentName, {
    ...updatedData,
    modifiedOn: new Date(),
    modifiedBy: user
  });
};

export const disableEnvironment = async (environmentName: string) => {
  return await disableEnvironmentByName(environmentName);
};

export const restoreEnvironment = async (environmentName: string) => {
  return await enableEnvironmentByName(environmentName);
};

export const searchEnvironment = async (searchTerm: string) => {
  return await searchEnvironmentsByName(searchTerm);
};
