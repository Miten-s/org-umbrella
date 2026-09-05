import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import type { BulkSelection, ListResult, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneWorkflow,
  bulkCopyWorkflow,
  bulkDeleteWorkflow,
  bulkRestoreWorkflow,
  bulkUpdateWorkflow,
  createWorkflow,
  disableWorkflow,
  enableWorkflow,
  fetchWorkflowById,
  fetchWorkflowOptions,
  updateWorkflow
} from "./Workflow.api";
import type { Workflow, WorkflowPayload } from "./Workflow.types";

export const workflowKeys = {
  all: ["workflow"] as const,
  list: (params: ServerListParams) => ["workflow", "list", params] as const,
  options: ["workflow", "options"] as const
};

export const useWorkflowById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: workflowKeys.all,
    fetchById: fetchWorkflowById,
    id,
    enabled
  });

export const useWorkflowOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({
    queryKey: workflowKeys.options,
    fetchPage: fetchWorkflowOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

const useInvalidateWorkflows = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: workflowKeys.all });
};

export const useCreateWorkflow = () => {
  const invalidate = useInvalidateWorkflows();
  return useMutation({
    mutationFn: (payload: WorkflowPayload) => createWorkflow(payload),
    onSuccess: () => {
      toast("Workflow created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateWorkflow = () => {
  const invalidate = useInvalidateWorkflows();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkflowPayload }) => updateWorkflow(id, payload),
    onSuccess: () => {
      toast("Workflow updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteWorkflow = () => {
  const invalidate = useInvalidateWorkflows();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteWorkflow(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} workflows deleted successfully.` : "Workflow deleted successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkCloneWorkflow = () => {
  const invalidate = useInvalidateWorkflows();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneWorkflow(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} workflows copied successfully.` : "Workflow copied successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkCopyWorkflow = () => {
  const invalidate = useInvalidateWorkflows();
  return useMutation({
    mutationFn: (records: WorkflowPayload[]) => bulkCopyWorkflow(records),
    onSuccess: (data) => {
      toast(data.length > 1 ? `${data.length} workflows copied successfully.` : "Workflow copied successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkUpdateWorkflow = () => {
  const invalidate = useInvalidateWorkflows();
  return useMutation({
    mutationFn: (updates: { id: string; payload: WorkflowPayload }[]) => bulkUpdateWorkflow(updates),
    onSuccess: (data) => {
      toast(
        data.results.length > 1 ? `${data.results.length} workflows updated successfully.` : "Workflow updated successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkRestoreWorkflow = () => {
  const invalidate = useInvalidateWorkflows();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkRestoreWorkflow(selection),
    onSuccess: (data) => {
      toast(data.count > 1 ? `${data.count} workflows restored successfully.` : "Workflow restored successfully.", "success");
      invalidate();
    }
  });
};

/** Optimistic enable/disable toggle (MIGRATION.md §3.1-D). No onError toast. */
export const useToggleWorkflowStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workflow: Workflow) =>
      workflow.status === "enabled" ? disableWorkflow(workflow.id) : enableWorkflow(workflow.id),
    onMutate: async (workflow) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.all });
      const nextStatus = workflow.status === "enabled" ? "disabled" : "enabled";
      const snapshots = queryClient.getQueriesData<ListResult<Workflow>>({ queryKey: workflowKeys.all });
      snapshots.forEach(([key, data]) => {
        if (!data?.rows) return;
        queryClient.setQueryData<ListResult<Workflow>>(key, {
          ...data,
          rows: data.rows.map((row) => (row.id === workflow.id ? { ...row, status: nextStatus } : row))
        });
      });
      return { snapshots };
    },
    onSuccess: (_data, workflow) =>
      toast(
        workflow.status === "enabled" ? "Workflow disabled successfully." : "Workflow enabled successfully.",
        "success"
      ),
    onError: (_error, _workflow, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: workflowKeys.all })
  });
};
