import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsStockBatch,
  bulkCopyLimsStockBatch,
  bulkDeleteLimsStockBatch,
  bulkUpdateLimsStockBatch,
  createLimsStockBatch,
  fetchLimsStockBatchAudit,
  fetchLimsStockBatchOptions,
  restoreLimsStockBatch,
  updateLimsStockBatch,
  fetchLimsStockBatchById
} from "./LimsStockBatch.api";
import type { LimsStockBatchPayload } from "./LimsStockBatch.types";

export const limsStockBatchKeys = {
  all: ["limsStockBatch"] as const,
  list: (params: ServerListParams) => ["limsStockBatch", "list", params] as const,
  audit: (id: string) => ["limsStockBatch", "audit", id] as const,
  options: ["limsStockBatch", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsStockBatchOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsStockBatchKeys.options,
    fetchPage: fetchLimsStockBatchOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsStockBatchAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsStockBatchKeys.audit(id ?? "none"),
    fetchPage: fetchLimsStockBatchAudit,
    id
  });

export const useLimsStockBatchById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsStockBatchKeys.all,
    fetchById: fetchLimsStockBatchById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsStockBatch = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsStockBatchPayload; files?: File[] }) => createLimsStockBatch(payload, files),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsStockBatch = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: LimsStockBatchPayload; files?: File[] }) =>
      updateLimsStockBatch(id, payload, files),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsStockBatch = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsStockBatch(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} records removed successfully.`
          : "Record removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsStockBatch = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsStockBatch(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} records copied successfully.`
          : "Record copied successfully.",
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
export const useBulkCopyLimsStockBatch = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsStockBatchPayload[]) => bulkCopyLimsStockBatch(records),
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

export const useBulkUpdateLimsStockBatch = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsStockBatchPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsStockBatch(updates, changeReason),
    onSuccess: (data) => {
      toast(
        data.count > 1
          ? `${data.count} records updated successfully.`
          : "Record updated successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useRestoreLimsStockBatch = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsStockBatch(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
