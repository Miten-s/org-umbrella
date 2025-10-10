import { WorkflowModel } from "../models/gxp-service-workflows.model";
import { STATUS } from "../types/common.types";

export const createWorkflow = async (data: any) => {
  return await WorkflowModel.create(data);
};

export const getAllWorkflows = async () => {
  return await WorkflowModel.find().lean();
};

export const getWorkflowById = async (workflowId: string) => {
  return await WorkflowModel.findOne({ workflowId });
};

export const updateWorkflow = async (workflowId: string, data: any) => {
  return await WorkflowModel.findOneAndUpdate({ workflowId }, data, {
    new: true
  });
};

export const disableWorkflow = async (workflowId: string) => {
  return await WorkflowModel.findOneAndUpdate(
    { workflowId },
    { isActive: false },
    { new: true }
  );
};

export const enableWorkflow = async (workflowId: string) => {
  return await WorkflowModel.findOneAndUpdate(
    { workflowId },
    { status: STATUS.ENABLED },
    { new: true }
  );
};

export const searchWorkflows = async (searchTerm: string) => {
  return await WorkflowModel.find({
    $or: [
      { workflowId: new RegExp(searchTerm, "i") },
      { workflowName: new RegExp(searchTerm, "i") }
    ]
  });
};
