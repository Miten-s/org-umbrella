import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsAliquot,
  bulkCopyLimsAliquot,
  bulkDeleteLimsAliquot,
  bulkUpdateLimsAliquot,
  createLimsAliquot,
  fetchLimsAliquotAudit,
  fetchLimsAliquotOptions,
  restoreLimsAliquot,
  updateLimsAliquot,
  fetchLimsAliquotById
} from "./LimsAliquot.api";
import type { LimsAliquotPayload } from "./LimsAliquot.types";

export const limsAliquotKeys = {
  all: ["limsAliquot"] as const,
  list: (params: ServerListParams) => ["limsAliquot", "list", params] as const,
  audit: (id: string) => ["limsAliquot", "audit", id] as const,
  options: ["limsAliquot", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsAliquotOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsAliquotKeys.options,
    fetchPage: fetchLimsAliquotOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsAliquotAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsAliquotKeys.audit(id ?? "none"),
    fetchPage: fetchLimsAliquotAudit,
    id
  });

export const useLimsAliquotById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsAliquotKeys.all,
    fetchById: fetchLimsAliquotById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsAliquotPayload) => createLimsAliquot(payload),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsAliquotPayload }) => updateLimsAliquot(id, payload),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsAliquot(selection, changeReason),
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

export const useBulkCloneLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsAliquot(selection),
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
export const useBulkCopyLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsAliquotPayload[]) => bulkCopyLimsAliquot(records),
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

export const useBulkUpdateLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsAliquotPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsAliquot(updates, changeReason),
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

export const useRestoreLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsAliquot(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
