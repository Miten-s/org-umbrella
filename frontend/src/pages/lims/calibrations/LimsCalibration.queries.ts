import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsCalibration,
  bulkCopyLimsCalibration,
  bulkDeleteLimsCalibration,
  bulkRestoreLimsCalibration,
  bulkUpdateLimsCalibration,
  createLimsCalibration,
  fetchLimsCalibrationAudit,
  fetchLimsCalibrationOptions,
  restoreLimsCalibration,
  updateLimsCalibration,
  fetchLimsCalibrationById
} from "./LimsCalibration.api";
import type { LimsCalibrationPayload } from "./LimsCalibration.types";

export const limsCalibrationKeys = {
  all: ["limsCalibration"] as const,
  list: (params: ServerListParams) => ["limsCalibration", "list", params] as const,
  audit: (id: string) => ["limsCalibration", "audit", id] as const,
  options: ["limsCalibration", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsCalibrationOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsCalibrationKeys.options,
    fetchPage: fetchLimsCalibrationOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsCalibrationAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsCalibrationKeys.audit(id ?? "none"),
    fetchPage: fetchLimsCalibrationAudit,
    id
  });

export const useLimsCalibrationById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsCalibrationKeys.all,
    fetchById: fetchLimsCalibrationById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsCalibration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsCalibrationPayload) => createLimsCalibration(payload),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsCalibration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsCalibrationPayload }) => updateLimsCalibration(id, payload),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsCalibration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsCalibration(selection, changeReason),
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

export const useBulkRestoreLimsCalibration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkRestoreLimsCalibration(selection, changeReason),
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

export const useBulkCloneLimsCalibration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsCalibration(selection),
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
export const useBulkCopyLimsCalibration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsCalibrationPayload[]) => bulkCopyLimsCalibration(records),
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

export const useBulkUpdateLimsCalibration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsCalibrationPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsCalibration(updates, changeReason),
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

export const useRestoreLimsCalibration = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsCalibration(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
