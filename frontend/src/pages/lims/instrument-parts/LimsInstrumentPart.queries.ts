import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsInstrumentPart,
  bulkCopyLimsInstrumentPart,
  bulkDeleteLimsInstrumentPart,
  bulkUpdateLimsInstrumentPart,
  createLimsInstrumentPart,
  fetchLimsInstrumentPartAudit,
  fetchLimsInstrumentPartOptions,
  restoreLimsInstrumentPart,
  updateLimsInstrumentPart,
  fetchLimsInstrumentPartById
} from "./LimsInstrumentPart.api";
import type { LimsInstrumentPartPayload } from "./LimsInstrumentPart.types";

export const limsInstrumentPartKeys = {
  all: ["limsInstrumentPart"] as const,
  list: (params: ServerListParams) => ["limsInstrumentPart", "list", params] as const,
  audit: (id: string) => ["limsInstrumentPart", "audit", id] as const,
  options: ["limsInstrumentPart", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsInstrumentPartOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsInstrumentPartKeys.options,
    fetchPage: fetchLimsInstrumentPartOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsInstrumentPartAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsInstrumentPartKeys.audit(id ?? "none"),
    fetchPage: fetchLimsInstrumentPartAudit,
    id
  });

export const useLimsInstrumentPartById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsInstrumentPartKeys.all,
    fetchById: fetchLimsInstrumentPartById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsInstrumentPart = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsInstrumentPartPayload; files?: File[] }) => createLimsInstrumentPart(payload, files),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsInstrumentPart = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: LimsInstrumentPartPayload; files?: File[] }) =>
      updateLimsInstrumentPart(id, payload, files),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsInstrumentPart = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsInstrumentPart(selection, changeReason),
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

export const useBulkCloneLimsInstrumentPart = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsInstrumentPart(selection),
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
export const useBulkCopyLimsInstrumentPart = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsInstrumentPartPayload[]) => bulkCopyLimsInstrumentPart(records),
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

export const useBulkUpdateLimsInstrumentPart = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsInstrumentPartPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsInstrumentPart(updates, changeReason),
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

export const useRestoreLimsInstrumentPart = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsInstrumentPart(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
