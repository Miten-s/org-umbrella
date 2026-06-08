import { GxpServiceWorkFlowModel } from "../models/gxp-service-workflows.model";
import { STATUS } from "../types/common.types";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

export const createWorkflow = async (data: any) => {
  return await GxpServiceWorkFlowModel.create(data);
};


export const getAllWorkflows = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const filter: any = {};
  if (search) {
    const sanitizedSearch = escapeRegex(search);
    filter.$or = [
      { workflowName: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    ];
  }
  const [data, totalCount] = await Promise.all([
    GxpServiceWorkFlowModel.find(filter).skip(skip).limit(limit).lean(),
    GxpServiceWorkFlowModel.countDocuments(filter).exec()
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

export const bulkDeleteWorkflows = async (workflowIds: string[], session?: any) => {
  return await GxpServiceWorkFlowModel.deleteMany(
    { _id: { $in: workflowIds } },
    { session }
  );
};

export const findWorkflowsByIds = async (workflowIds: string[]) => {
  return await GxpServiceWorkFlowModel.find({ _id: { $in: workflowIds } });
};

export const getWorkflowsByFilter = async (filter: any) => {
  return await GxpServiceWorkFlowModel.find(filter);
};
