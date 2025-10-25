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
  const result = await GxpServiceWorkFlowModel.findOneAndUpdate(
    { _id: workflowId },
    data,
    {
      new: true
    }
  );
  return result;
};

export const disableWorkflow = async (workflowId: string, user: string) => {
  return await GxpServiceWorkFlowModel.findOneAndUpdate(
    { _id: workflowId },
    { status: STATUS.DISABLED, modifiedOn: new Date(), modifiedBy: user },
    { new: true }
  );
};

export const enableWorkflow = async (workflowId: string, user: string) => {
  return await GxpServiceWorkFlowModel.findOneAndUpdate(
    { _id: workflowId },
    { status: STATUS.ENABLED, modifiedOn: new Date(), modifiedBy: user },
    { new: true }
  );
};

export const deleteWorkflow = async (workflowId: string) => {
  return await GxpServiceWorkFlowModel.deleteOne({ _id: workflowId });
};
