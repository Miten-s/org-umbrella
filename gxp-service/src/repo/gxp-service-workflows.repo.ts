import { GxpServiceWorkFlowModel } from "../models/gxp-service-workflows.model";
import { STATUS } from "../types/common.types";

export const createWorkflow = async (data: any) => {
  return await GxpServiceWorkFlowModel.create(data);
};

export const getAllWorkflows = async () => {
  return await GxpServiceWorkFlowModel.find().lean();
};

export const getWorkflowById = async (workflowId: string) => {
  return await GxpServiceWorkFlowModel.findOne({ workflowId });
};

export const updateWorkflow = async (workflowId: string, data: any) => {
  return await GxpServiceWorkFlowModel.findOneAndUpdate({ workflowId }, data, {
    new: true
  });
};

export const disableWorkflow = async (workflowId: string) => {
  return await GxpServiceWorkFlowModel.findOneAndUpdate(
    { workflowId },
    { isActive: false },
    { new: true }
  );
};

export const enableWorkflow = async (workflowId: string) => {
  return await GxpServiceWorkFlowModel.findOneAndUpdate(
    { workflowId },
    { status: STATUS.ENABLED },
    { new: true }
  );
};

export const searchWorkflows = async (searchTerm: string) => {
  return await GxpServiceWorkFlowModel.find({
    $or: [
      { workflowId: new RegExp(searchTerm, "i") },
      { workflowName: new RegExp(searchTerm, "i") }
    ]
  });
};
