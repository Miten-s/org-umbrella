import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsInstrument,
  bulkCopyLimsInstrument,
  bulkDeleteLimsInstrument,
  bulkRestoreLimsInstrument,
  bulkUpdateLimsInstrument,
  createLimsInstrument,
  fetchLimsInstrumentAudit,
  fetchLimsInstrumentOptions,
  restoreLimsInstrument,
  updateLimsInstrument,
  fetchLimsInstrumentById
} from "./LimsInstrument.api";
import type { LimsInstrumentPayload } from "./LimsInstrument.types";

export const limsInstrumentKeys = {
  all: ["limsInstrument"] as const,
  list: (params: ServerListParams) => ["limsInstrument", "list", params] as const,
  audit: (id: string) => ["limsInstrument", "audit", id] as const,
  options: ["limsInstrument", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsInstrumentOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsInstrumentKeys.options,
    fetchPage: fetchLimsInstrumentOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsInstrumentAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsInstrumentKeys.audit(id ?? "none"),
    fetchPage: fetchLimsInstrumentAudit,
    id
  });

export const useLimsInstrumentById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsInstrumentKeys.all,
    fetchById: fetchLimsInstrumentById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsInstrument = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsInstrumentPayload; files?: File[] }) => createLimsInstrument(payload, files),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsInstrument = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: LimsInstrumentPayload; files?: File[] }) =>
      updateLimsInstrument(id, payload, files),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsInstrument = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsInstrument(selection, changeReason),
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

export const useBulkRestoreLimsInstrument = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkRestoreLimsInstrument(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} records restored successfully.`
          : "Record restored successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsInstrument = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsInstrument(selection),
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

/** The Copy flow's batched save (CopyStepper): one request creates every reviewed
 * record; a collision is warned, not rejected. */
export const useBulkCopyLimsInstrument = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsInstrumentPayload[]) => bulkCopyLimsInstrument(records),
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

export const useBulkUpdateLimsInstrument = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsInstrumentPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsInstrument(updates, changeReason),
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

export const useRestoreLimsInstrument = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsInstrument(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
