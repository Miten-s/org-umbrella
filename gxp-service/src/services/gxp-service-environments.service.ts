import * as repo from "../repo/gxp-service-environments.repo";

export const addNewEnvironment = async (data: any, user: any) => {
  const environmentToCreate = {
    ...data,
    createdOn: new Date(),
    createdBy: user,
    modifiedOn: new Date(),
    modifiedBy: null,
    isActive: true
  };

  return await repo.createEnvironment(environmentToCreate);
};

export const getAllEnvironments = async () => {
  return await repo.findAllEnvironments();
};

export const updateEnvironment = async (
  id: string,
  updatedData: any,
  user: any
) => {
  return await repo.updateEnvironment(id, {
    ...updatedData,
    modifiedOn: new Date(),
    modifiedBy: user
  });
};

export const disableEnvironment = async (id: string) => {
  return await repo.disableEnvironment(id);
};

export const restoreEnvironment = async (id: string) => {
  return await repo.enableEnvironment(id);
};

export const deleteEnvironment = async (id: string) => {
  return await repo.disableEnvironment(id);
};
