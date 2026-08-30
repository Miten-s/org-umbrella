import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsStudy,
  bulkCopyLimsStudy,
  bulkDeleteLimsStudy,
  bulkUpdateLimsStudy,
  createLimsStudy,
  fetchLimsStudyAudit,
  fetchLimsStudyOptions,
  restoreLimsStudy,
  updateLimsStudy,
  fetchLimsStudyById
} from "./LimsStudy.api";
import type { LimsStudyPayload } from "./LimsStudy.types";

export const limsStudyKeys = {
  all: ["limsStudy"] as const,
  list: (params: ServerListParams) => ["limsStudy", "list", params] as const,
  audit: (id: string) => ["limsStudy", "audit", id] as const,
  options: ["limsStudy", "options"] as const
};

export const useLimsStudyOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsStudyKeys.options,
    fetchPage: fetchLimsStudyOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsStudyAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsStudyKeys.audit(id ?? "none"),
    fetchPage: fetchLimsStudyAudit,
    id
  });

export const useLimsStudyById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsStudyKeys.all,
    fetchById: fetchLimsStudyById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsStudy = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsStudyPayload; files?: File[] }) =>
      createLimsStudy(payload, files),
    onSuccess: () => {
      toast("Study created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsStudy = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      files
    }: {
      id: string;
      payload: LimsStudyPayload;
      files?: File[];
    }) => updateLimsStudy(id, payload, files),
    onSuccess: () => {
      toast("Study updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsStudy = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsStudy(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} studys removed successfully.`
          : "Study removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsStudy = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsStudy(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} studys copied successfully.`
          : "Study copied successfully.",
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
export const useBulkCopyLimsStudy = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsStudyPayload[]) => bulkCopyLimsStudy(records),
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

export const useBulkUpdateLimsStudy = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsStudyPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsStudy(updates, changeReason),
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

export const useRestoreLimsStudy = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsStudy(id, changeReason),
    onSuccess: () => {
      toast("Study restored successfully.", "success");
      invalidate();
    }
  });
};
