import {
  createWorkflow,
  getAllWorkflows,
  updateWorkflow,
  disableWorkflow,
  enableWorkflow,
  searchWorkflows
} from "../repo/gsx-service-workflows.repo";

export const addWorkflow = async (workflowData: any) => {
  const newWorkflow = {
    ...workflowData,
    createdOn: new Date(),
    modifiedOn: new Date(),
    status: "enabled"
  };

  return await createWorkflow(newWorkflow);
};

export const getAll = async () => {
  return await getAllWorkflows();
};

export const update = async (workflowId: string, updatedData: any) => {
  return await updateWorkflow(workflowId, {
    ...updatedData,
    modifiedOn: new Date()
  });
};

export const disable = async (workflowId: string) => {
  return await disableWorkflow(workflowId);
};

export const enable = async (workflowId: string) => {
  return await enableWorkflow(workflowId);
};

export const search = async (term: string) => {
  return await searchWorkflows(term);
};
