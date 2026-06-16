import Workflow, { IWorkflow } from "../models/gxp-service-workflows.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";

const formatWorkflow = (wf: any) => {
  if (!wf) return null;
  const json = wf.toJSON ? wf.toJSON() : { ...wf };
  json._id = json.id;
  return json;
};

export const createWorkflow = async (data: any) => {
  const doc = await Workflow.create(data);
  return formatWorkflow(doc);
};

export const getAllWorkflows = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const where: any = {};
  if (search) {
    const sanitizedSearch = `%${search}%`;
    where[Op.or] = [
      { workflowName: { [Op.iLike]: sanitizedSearch } },
      { description: { [Op.iLike]: sanitizedSearch } }
    ];
  }
  const { count: totalCount, rows: data } = await Workflow.findAndCountAll({
    where,
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });
  return {
    data: data.map(formatWorkflow),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const getWorkflowById = async (workflowId: string) => {
  const doc = await Workflow.findByPk(workflowId);
  return formatWorkflow(doc);
};

export const updateWorkflow = async (workflowId: string, data: any) => {
  const wf = await Workflow.findByPk(workflowId);
  if (!wf) return null;
  await wf.update(data);
  return formatWorkflow(wf);
};

export const disableWorkflow = async (workflowId: string, user: string) => {
  const wf = await Workflow.findByPk(workflowId);
  if (!wf) return null;
  await wf.update({ status: "disabled", modifiedOn: new Date(), modifiedBy: user });
  return formatWorkflow(wf);
};

export const enableWorkflow = async (workflowId: string, user: string) => {
  const wf = await Workflow.findByPk(workflowId);
  if (!wf) return null;
  await wf.update({ status: "enabled", modifiedOn: new Date(), modifiedBy: user });
  return formatWorkflow(wf);
};

export const deleteWorkflow = async (workflowId: string) => {
  const wf = await Workflow.findByPk(workflowId);
  if (!wf) return null;
  await wf.destroy();
  return formatWorkflow(wf);
};

export const bulkDeleteWorkflows = async (workflowIds: string[], session?: any) => {
  return await Workflow.destroy({
    where: { id: workflowIds }
  });
};

export const findWorkflowsByIds = async (workflowIds: string[]) => {
  const data = await Workflow.findAll({
    where: { id: workflowIds }
  });
  return data.map(formatWorkflow);
};

export const getWorkflowsByFilter = async (filter: any) => {
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }
  const data = await Workflow.findAll({ where });
  return data.map(formatWorkflow);
};
