import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneEnvironment,
  bulkDeleteEnvironment,
  createEnvironment,
  fetchEnvironmentOptions,
  updateEnvironment
} from "./Environment.api";
import type { EnvironmentPayload } from "./Environment.types";

export const environmentKeys = {
  all: ["environment"] as const,
  list: (params: ServerListParams) => ["environment", "list", params] as const,
  options: ["environment", "options"] as const
};

export const useEnvironmentOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({
    queryKey: environmentKeys.options,
    fetchPage: fetchEnvironmentOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

const useInvalidateEnvironments = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: environmentKeys.all });
};

export const useCreateEnvironment = () => {
  const invalidate = useInvalidateEnvironments();
  return useMutation({
    mutationFn: (payload: EnvironmentPayload) => createEnvironment(payload),
    onSuccess: () => {
      toast("Environment created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateEnvironment = () => {
  const invalidate = useInvalidateEnvironments();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EnvironmentPayload }) => updateEnvironment(id, payload),
    onSuccess: () => {
      toast("Environment updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteEnvironment = () => {
  const invalidate = useInvalidateEnvironments();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteEnvironment(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} environments deleted successfully.` : "Environment deleted successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkCloneEnvironment = () => {
  const invalidate = useInvalidateEnvironments();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneEnvironment(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} environments copied successfully.` : "Environment copied successfully.", "success");
      invalidate();
    }
  });
};
