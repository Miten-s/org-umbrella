import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneDesignation,
  bulkCopyDesignation,
  bulkDeleteDesignation,
  bulkUpdateDesignation,
  createDesignation,
  deleteDesignation,
  fetchDesignationOptions,
  updateDesignation
} from "./Designation.api";
import type { DesignationPayload } from "./Designation.types";

/** React Query keys (STANDARDS.md §2). */
export const designationKeys = {
  all: ["designation"] as const,
  list: (params: ServerListParams) => ["designation", "list", params] as const,
  detail: (id: string) => ["designation", "detail", id] as const,
  options: ["designation", "options"] as const
};

/** Bound options hook for AsyncSelect consumers of Designation. */
export const useDesignationOptions = (
  args: { search: string; enabled?: boolean; selectedValues?: string[] }
) =>
  useAsyncOptions({
    queryKey: designationKeys.options,
    fetchPage: fetchDesignationOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

/** Invalidate every designation list after a mutation (STANDARDS.md §9). */
const useInvalidateDesignations = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: designationKeys.all });
};

export const useCreateDesignation = () => {
  const invalidate = useInvalidateDesignations();
  return useMutation({
    mutationFn: (payload: DesignationPayload) => createDesignation(payload),
    onSuccess: () => {
      toast("Designation created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateDesignation = () => {
  const invalidate = useInvalidateDesignations();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DesignationPayload }) =>
      updateDesignation(id, payload),
    onSuccess: () => {
      toast("Designation updated successfully.", "success");
      invalidate();
    }
  });
};

export const useDeleteDesignation = () => {
  const invalidate = useInvalidateDesignations();
  return useMutation({
    mutationFn: (id: string) => deleteDesignation(id),
    onSuccess: () => invalidate()
  });
};

export const useBulkDeleteDesignation = () => {
  const invalidate = useInvalidateDesignations();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteDesignation(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1 ? `${count} designations deleted successfully.` : "Designation deleted successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneDesignation = () => {
  const invalidate = useInvalidateDesignations();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneDesignation(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1 ? `${count} designations copied successfully.` : "Designation copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCopyDesignation = () => {
  const invalidate = useInvalidateDesignations();
  return useMutation({
    mutationFn: (records: DesignationPayload[]) => bulkCopyDesignation(records),
    onSuccess: (data) => {
      toast(
        data.count > 1 ? `${data.count} designations copied successfully.` : "Designation copied successfully.",
        "success"
      );
      const warnings = data.results.filter((r) => r.warning);
      if (warnings.length) {
        toast(
          warnings.length === 1
            ? warnings[0].warning!
            : `${warnings.length} of ${data.count} kept their original name — renamed to stay unique.`,
          "info"
        );
      }
      invalidate();
    }
  });
};

export const useBulkUpdateDesignation = () => {
  const invalidate = useInvalidateDesignations();
  return useMutation({
    mutationFn: (updates: { id: string; payload: DesignationPayload }[]) => bulkUpdateDesignation(updates),
    onSuccess: (data) => {
      toast(
        data.count > 1 ? `${data.count} designations updated successfully.` : "Designation updated successfully.",
        "success"
      );
      invalidate();
    }
  });
};
