import * as repo from "../repo/gxp-service-workflows.repo";
import { PaginationOptions } from "../utils/pagination.util";
import GxpServiceApplicationModel from "../models/gxp-service-applications.model";
import ServiceRequest from "../models/gxp-service-service-requests.model";
import { sequelize } from "../configs/db.sequelize";
import crypto from "crypto";

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

const stripCopySuffix = (name: string) => {
  const match = name.match(/^(.*?)(?:-\(\d+\))?$/);
  return match?.[1]?.trim() || name.trim() || "Workflow";
};

const buildCopyName = (baseName: string, index: number) => {
  const suffix = `-(${index})`;
  const maxWorkflowNameLength = 20;
  const availableBaseLength = maxWorkflowNameLength - suffix.length;
  const safeBase =
    baseName.slice(0, Math.max(1, availableBaseLength)).trim() || "Workflow";
  return `${safeBase}${suffix}`;
};

const getNextWorkflowCopyName = (baseName: string, usedNames: Set<string>) => {
  let index = 1;
  let candidate = buildCopyName(baseName, index);

  while (usedNames.has(candidate)) {
    index += 1;
    candidate = buildCopyName(baseName, index);
  }

  usedNames.add(candidate);
  return candidate;
};

export const bulkDeleteWorkflows = async (workflowIds: string[]) => {
  const t = await sequelize.transaction();
  try {
    await repo.bulkDeleteWorkflows(workflowIds, t);

    await GxpServiceApplicationModel.update(
      { applicationWorkflowId: null },
      { where: { applicationWorkflowId: workflowIds }, transaction: t }
    );

    await ServiceRequest.update(
      { workflowId: null },
      { where: { workflowId: workflowIds }, transaction: t }
    );

    await t.commit();
    return { success: true, message: "Workflows deleted successfully" };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkDuplicateWorkflows = async (
  workflowIds: string[],
  user: string
) => {
  const t = await sequelize.transaction();
  try {
    const workflowsToDuplicate = await repo.findWorkflowsByIds(workflowIds);
    if (!workflowsToDuplicate || workflowsToDuplicate.length === 0) {
      throw new Error("No workflows found for the provided IDs");
    }

    const existingWorkflows = await repo.getWorkflowsByFilter({});
    const usedWorkflowNames = new Set(
      existingWorkflows.map((workflow: any) => workflow.workflowName)
    );
    const duplicatedWorkflows = [];

    for (const workflow of workflowsToDuplicate) {
      const baseName = stripCopySuffix(workflow.workflowName);
      const newName = getNextWorkflowCopyName(baseName, usedWorkflowNames);
      const now = new Date();

      const toSave: any = {
        ...workflow,
        id: crypto.randomUUID(),
        workflowName: newName,
        createdOn: now,
        createdBy: user,
        modifiedOn: now,
        modifiedBy: user,
        status: workflow.status ?? "enabled"
      };

      delete toSave._id;
      delete toSave.__v;
      delete toSave.createdAt;
      delete toSave.updatedAt;

      const inserted = await repo.createWorkflow(toSave);
      duplicatedWorkflows.push(inserted);
    }

    await t.commit();
    return duplicatedWorkflows;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
