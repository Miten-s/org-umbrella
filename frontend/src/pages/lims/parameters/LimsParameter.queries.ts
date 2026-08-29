import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsParameter,
  bulkCopyLimsParameter,
  bulkDeleteLimsParameter,
  createLimsParameter,
  fetchLimsParameterAudit,
  fetchLimsParameterOptions,
  restoreLimsParameter,
  updateLimsParameter,
  fetchLimsParameterById
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
  useLimsAuditTrail({
    queryKey: limsParameterKeys.audit(id ?? "none"),
    fetchPage: fetchLimsParameterAudit,
    id
  });

export const useLimsParameterById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsParameterKeys.all,
    fetchById: fetchLimsParameterById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
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

/**
 * The Copy flow's batched save (see CopyStepper) — one request creates
 * every reviewed record. A collision is warned, not rejected (server
 * auto-suffixes) — surfaced here per record.
 */
export const useBulkCopyLimsParameter = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsParameterPayload[]) => bulkCopyLimsParameter(records),
    onSuccess: (data) => {
      const warnings = data.results.filter((r) => r.warning);
      toast(
        data.count > 1
          ? `${data.count} records copied successfully.`
          : "Record copied successfully.",
        "success"
      );
      if (warnings.length) {
        toast(
          warnings.length === 1
            ? warnings[0].warning!
            : `${warnings.length} of ${data.count} kept their original name — renamed to stay unique.`,
          "info",
          { duration: 6000 }
        );
      }
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
