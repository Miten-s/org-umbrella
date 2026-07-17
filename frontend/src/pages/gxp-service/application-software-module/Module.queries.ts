import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ListResult, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneModule,
  bulkDeleteModule,
  createModule,
  fetchModuleOptions,
  setModuleStatus,
  updateModule
} from "./Module.api";
import type { ApplicationSoftwareModule, ModulePayload } from "./Module.types";

export const moduleKeys = {
  all: ["module"] as const,
  list: (params: ServerListParams) => ["module", "list", params] as const,
  options: ["module", "options"] as const
};

export const useModuleOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({
    queryKey: moduleKeys.options,
    fetchPage: fetchModuleOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

const useInvalidateModules = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: moduleKeys.all });
};

export const useCreateModule = () => {
  const invalidate = useInvalidateModules();
  return useMutation({
    mutationFn: (payload: ModulePayload) => createModule(payload),
    onSuccess: () => {
      toast("Module created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateModule = () => {
  const invalidate = useInvalidateModules();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModulePayload }) => updateModule(id, payload),
    onSuccess: () => {
      toast("Module updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteModule = () => {
  const invalidate = useInvalidateModules();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteModule(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} modules deleted successfully.` : "Module deleted successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkCloneModule = () => {
  const invalidate = useInvalidateModules();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneModule(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} modules copied successfully.` : "Module copied successfully.", "success");
      invalidate();
    }
  });
};

/** Optimistic enable/disable toggle (MIGRATION.md §3.1-D). No onError toast. */
export const useToggleModuleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (module: ApplicationSoftwareModule) =>
      setModuleStatus(module.id, module.status === "enabled" ? "disabled" : "enabled"),
    onMutate: async (module) => {
      await queryClient.cancelQueries({ queryKey: moduleKeys.all });
      const nextStatus = module.status === "enabled" ? "disabled" : "enabled";
      const snapshots = queryClient.getQueriesData<ListResult<ApplicationSoftwareModule>>({ queryKey: moduleKeys.all });
      snapshots.forEach(([key, data]) => {
        if (!data?.rows) return;
        queryClient.setQueryData<ListResult<ApplicationSoftwareModule>>(key, {
          ...data,
          rows: data.rows.map((row) => (row.id === module.id ? { ...row, status: nextStatus } : row))
        });
      });
      return { snapshots };
    },
    onSuccess: (_data, module) =>
      toast(module.status === "enabled" ? "Module disabled successfully." : "Module enabled successfully.", "success"),
    onError: (_error, _module, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: moduleKeys.all })
  });
};
