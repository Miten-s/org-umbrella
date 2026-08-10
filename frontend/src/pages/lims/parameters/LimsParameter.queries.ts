import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { extractList } from "@/utils/listResponse";
import type { LimsAuditEntry } from "@/components/data/AuditTrailDialog";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsParameter,
  bulkDeleteLimsParameter,
  createLimsParameter,
  fetchLimsParameterAudit,
  fetchLimsParameterOptions,
  restoreLimsParameter,
  updateLimsParameter
} from "./LimsParameter.api";
import type { LimsParameterPayload } from "./LimsParameter.types";

export const limsParameterKeys = {
  all: ["limsParameter"] as const,
  list: (params: ServerListParams) => ["limsParameter", "list", params] as const,
  audit: (id: string) => ["limsParameter", "audit", id] as const,
  options: ["limsParameter", "options"] as const
};

export const useLimsParameterOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsParameterKeys.options,
    fetchPage: fetchLimsParameterOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsParameterAudit = (id?: string) =>
  useQuery({
    queryKey: limsParameterKeys.audit(id ?? "none"),
    queryFn: async ({ signal }) =>
      extractList<LimsAuditEntry>(await fetchLimsParameterAudit(id as string, signal), [
        "audit",
        "auditTrail",
        "entries"
      ]),
    enabled: Boolean(id)
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: limsParameterKeys.all });
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsParameter = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsParameterPayload) => createLimsParameter(payload),
    onSuccess: () => {
      toast("Parameter created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsParameter = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsParameterPayload }) =>
      updateLimsParameter(id, payload),
    onSuccess: () => {
      toast("Parameter updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsParameter = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsParameter(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} parameters removed successfully.`
          : "Parameter removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsParameter = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsParameter(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} parameters copied successfully.`
          : "Parameter copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useRestoreLimsParameter = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsParameter(id, changeReason),
    onSuccess: () => {
      toast("Parameter restored successfully.", "success");
      invalidate();
    }
  });
};
