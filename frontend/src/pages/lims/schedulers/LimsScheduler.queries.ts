import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsScheduler,
  bulkCopyLimsScheduler,
  bulkDeleteLimsScheduler,
  createLimsScheduler,
  fetchLimsSchedulerAudit,
  fetchLimsSchedulerOptions,
  restoreLimsScheduler,
  updateLimsScheduler,
  fetchLimsSchedulerById
} from "./LimsScheduler.api";
import type { LimsSchedulerPayload } from "./LimsScheduler.types";

export const limsSchedulerKeys = {
  all: ["limsScheduler"] as const,
  list: (params: ServerListParams) => ["limsScheduler", "list", params] as const,
  audit: (id: string) => ["limsScheduler", "audit", id] as const,
  options: ["limsScheduler", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsSchedulerOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsSchedulerKeys.options,
    fetchPage: fetchLimsSchedulerOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsSchedulerAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsSchedulerKeys.audit(id ?? "none"),
    fetchPage: fetchLimsSchedulerAudit,
    id
  });

export const useLimsSchedulerById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsSchedulerKeys.all,
    fetchById: fetchLimsSchedulerById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsScheduler = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsSchedulerPayload) => createLimsScheduler(payload),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsScheduler = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsSchedulerPayload }) => updateLimsScheduler(id, payload),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsScheduler = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsScheduler(selection, changeReason),
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

export const useBulkCloneLimsScheduler = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsScheduler(selection),
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
export const useBulkCopyLimsScheduler = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsSchedulerPayload[]) => bulkCopyLimsScheduler(records),
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

export const useRestoreLimsScheduler = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsScheduler(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
