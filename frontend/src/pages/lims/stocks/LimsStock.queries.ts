import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsStock,
  bulkCopyLimsStock,
  bulkDeleteLimsStock,
  bulkUpdateLimsStock,
  createLimsStock,
  fetchLimsStockAudit,
  fetchLimsStockOptions,
  restoreLimsStock,
  updateLimsStock,
  fetchLimsStockById
} from "./LimsStock.api";
import type { LimsStockPayload } from "./LimsStock.types";

export const limsStockKeys = {
  all: ["limsStock"] as const,
  list: (params: ServerListParams) => ["limsStock", "list", params] as const,
  audit: (id: string) => ["limsStock", "audit", id] as const,
  options: ["limsStock", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsStockOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsStockKeys.options,
    fetchPage: fetchLimsStockOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsStockAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsStockKeys.audit(id ?? "none"),
    fetchPage: fetchLimsStockAudit,
    id
  });

export const useLimsStockById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsStockKeys.all,
    fetchById: fetchLimsStockById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsStock = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsStockPayload; files?: File[] }) => createLimsStock(payload, files),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsStock = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: LimsStockPayload; files?: File[] }) =>
      updateLimsStock(id, payload, files),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsStock = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsStock(selection, changeReason),
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

export const useBulkCloneLimsStock = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsStock(selection),
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
export const useBulkCopyLimsStock = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsStockPayload[]) => bulkCopyLimsStock(records),
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

export const useBulkUpdateLimsStock = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsStockPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsStock(updates, changeReason),
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

export const useRestoreLimsStock = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsStock(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
