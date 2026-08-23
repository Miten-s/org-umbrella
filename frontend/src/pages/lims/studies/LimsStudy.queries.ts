import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsStudy,
  bulkDeleteLimsStudy,
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
