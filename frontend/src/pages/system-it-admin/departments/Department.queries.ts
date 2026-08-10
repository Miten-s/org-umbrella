import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneDepartment,
  bulkDeleteDepartment,
  createDepartment,
  deleteDepartment,
  fetchDepartmentOptions,
  updateDepartment
} from "./Department.api";
import type { DepartmentPayload } from "./Department.types";

export const departmentKeys = {
  all: ["department"] as const,
  list: (params: ServerListParams) => ["department", "list", params] as const,
  detail: (id: string) => ["department", "detail", id] as const,
  options: ["department", "options"] as const
};

/** Bound options hook for AsyncSelect consumers selecting a department. */
export const useDepartmentOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: departmentKeys.options,
    fetchPage: fetchDepartmentOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

const useInvalidateDepartments = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: departmentKeys.all });
};

export const useCreateDepartment = () => {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (payload: DepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      toast("Department created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateDepartment = () => {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DepartmentPayload }) =>
      updateDepartment(id, payload),
    onSuccess: () => {
      toast("Department updated successfully.", "success");
      invalidate();
    }
  });
};

export const useDeleteDepartment = () => {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => invalidate()
  });
};

export const useBulkDeleteDepartment = () => {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteDepartment(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1 ? `${count} departments deleted successfully.` : "Department deleted successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneDepartment = () => {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneDepartment(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1 ? `${count} departments copied successfully.` : "Department copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};
