import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsResult,
  bulkDeleteLimsResult,
  createLimsResult,
  fetchLimsResultAudit,
  fetchLimsResultOptions,
  restoreLimsResult,
  updateLimsResult,
  fetchLimsResultById
} from "./LimsResult.api";
import type { LimsResultPayload } from "./LimsResult.types";

export const limsResultKeys = {
  all: ["limsResult"] as const,
  list: (params: ServerListParams) => ["limsResult", "list", params] as const,
  audit: (id: string) => ["limsResult", "audit", id] as const,
  options: ["limsResult", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsResultOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsResultKeys.options,
    fetchPage: fetchLimsResultOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsResultAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsResultKeys.audit(id ?? "none"),
    fetchPage: fetchLimsResultAudit,
    id
  });

export const useLimsResultById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsResultKeys.all,
    fetchById: fetchLimsResultById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsResult = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsResultPayload) => createLimsResult(payload),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsResult = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsResultPayload }) => updateLimsResult(id, payload),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsResult = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsResult(selection, changeReason),
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

export const useBulkCloneLimsResult = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsResult(selection),
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

export const useRestoreLimsResult = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsResult(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
