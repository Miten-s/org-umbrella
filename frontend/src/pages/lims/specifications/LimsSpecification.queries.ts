import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsSpecification,
  bulkCopyLimsSpecification,
  bulkDeleteLimsSpecification,
  bulkUpdateLimsSpecification,
  createLimsSpecification,
  fetchLimsSpecificationAudit,
  fetchLimsSpecificationOptions,
  restoreLimsSpecification,
  updateLimsSpecification,
  fetchLimsSpecificationById
} from "./LimsSpecification.api";
import type { LimsSpecificationPayload } from "./LimsSpecification.types";

export const limsSpecificationKeys = {
  all: ["limsSpecification"] as const,
  list: (params: ServerListParams) => ["limsSpecification", "list", params] as const,
  audit: (id: string) => ["limsSpecification", "audit", id] as const,
  options: ["limsSpecification", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsSpecificationOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsSpecificationKeys.options,
    fetchPage: fetchLimsSpecificationOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsSpecificationAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsSpecificationKeys.audit(id ?? "none"),
    fetchPage: fetchLimsSpecificationAudit,
    id
  });

export const useLimsSpecificationById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsSpecificationKeys.all,
    fetchById: fetchLimsSpecificationById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsSpecification = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsSpecificationPayload; files?: File[] }) => createLimsSpecification(payload, files),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsSpecification = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: LimsSpecificationPayload; files?: File[] }) =>
      updateLimsSpecification(id, payload, files),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsSpecification = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsSpecification(selection, changeReason),
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

export const useBulkCloneLimsSpecification = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsSpecification(selection),
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
export const useBulkCopyLimsSpecification = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsSpecificationPayload[]) => bulkCopyLimsSpecification(records),
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

export const useBulkUpdateLimsSpecification = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsSpecificationPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsSpecification(updates, changeReason),
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

export const useRestoreLimsSpecification = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsSpecification(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
