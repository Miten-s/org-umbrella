import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ListResult, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneAssignmentGroup,
  bulkDeleteAssignmentGroup,
  createAssignmentGroup,
  disableAssignmentGroup,
  enableAssignmentGroup,
  fetchAssignmentGroupOptions,
  updateAssignmentGroup
} from "./AssignmentGroup.api";
import type { AssignmentGroup, AssignmentGroupPayload } from "./AssignmentGroup.types";

export const assignmentGroupKeys = {
  all: ["assignmentGroup"] as const,
  list: (params: ServerListParams) => ["assignmentGroup", "list", params] as const,
  options: ["assignmentGroup", "options"] as const
};

export const useAssignmentGroupOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({
    queryKey: assignmentGroupKeys.options,
    fetchPage: fetchAssignmentGroupOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: assignmentGroupKeys.all });
};

export const useCreateAssignmentGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: AssignmentGroupPayload) => createAssignmentGroup(payload),
    onSuccess: () => {
      toast("Assignment group created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateAssignmentGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignmentGroupPayload }) =>
      updateAssignmentGroup(id, payload),
    onSuccess: () => {
      toast("Assignment group updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteAssignmentGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteAssignmentGroup(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} assignment groups deleted successfully.` : "Assignment group deleted successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkCloneAssignmentGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneAssignmentGroup(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} assignment groups copied successfully.` : "Assignment group copied successfully.", "success");
      invalidate();
    }
  });
};

/**
 * Optimistic active/inactive toggle (MIGRATION.md §3.1-D), keyed by groupName
 * exactly as the legacy service. No onError toast.
 */
export const useToggleAssignmentGroupStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: AssignmentGroup) =>
      group.isActive ? disableAssignmentGroup(group.groupName) : enableAssignmentGroup(group.groupName),
    onMutate: async (group) => {
      await queryClient.cancelQueries({ queryKey: assignmentGroupKeys.all });
      const nextActive = !group.isActive;
      const snapshots = queryClient.getQueriesData<ListResult<AssignmentGroup>>({ queryKey: assignmentGroupKeys.all });
      snapshots.forEach(([key, data]) => {
        if (!data?.rows) return;
        queryClient.setQueryData<ListResult<AssignmentGroup>>(key, {
          ...data,
          rows: data.rows.map((row) => (row.id === group.id ? { ...row, isActive: nextActive } : row))
        });
      });
      return { snapshots };
    },
    onSuccess: (_data, group) =>
      toast(group.isActive ? "Assignment group disabled successfully." : "Assignment group enabled successfully.", "success"),
    onError: (_error, _group, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: assignmentGroupKeys.all })
  });
};
