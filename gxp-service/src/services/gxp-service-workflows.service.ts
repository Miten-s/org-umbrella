import * as repo from "../repo/gxp-service-workflows.repo";
import { PaginationOptions } from "../utils/pagination.util";

export const addWorkflow = async (workflowData: any, user: string) => {
  const newWorkflow = {
    ...workflowData,
    createdBy: user,
    createdOn: new Date(),
    modifiedOn: new Date(),
    status: "enabled"
  };

  return await repo.createWorkflow(newWorkflow);
};


export const getWorkflows = async (options: PaginationOptions) => {
  return await repo.getAllWorkflows(options);
};

export const updateWorkflow = async (
  workflowId: string,
  updatedData: any,
  user: string
) => {
  return await repo.updateWorkflow(workflowId, {
    ...updatedData,
    modifiedOn: new Date(),
    modifiedBy: user
  });
};

export const disableWorkflow = async (workflowId: string, user: string) => {
  return await repo.disableWorkflow(workflowId, user);
};

export const enableWorkflow = async (workflowId: string, user: string) => {
  return await repo.enableWorkflow(workflowId, user);
};

export const deleteWorkflow = async (workflowId: string) => {
  return await repo.deleteWorkflow(workflowId);
};
