import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsSample,
  bulkDeleteLimsSample,
  createLimsSample,
  fetchLimsSampleAudit,
  fetchLimsSampleOptions,
  restoreLimsSample,
  updateLimsSample,
  fetchLimsSampleById
} from "./LimsSample.api";
import type { LimsSamplePayload } from "./LimsSample.types";

export const limsSampleKeys = {
  all: ["limsSample"] as const,
  list: (params: ServerListParams) => ["limsSample", "list", params] as const,
  audit: (id: string) => ["limsSample", "audit", id] as const,
  options: ["limsSample", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsSampleOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsSampleKeys.options,
    fetchPage: fetchLimsSampleOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsSampleAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsSampleKeys.audit(id ?? "none"),
    fetchPage: fetchLimsSampleAudit,
    id
  });

export const useLimsSampleById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsSampleKeys.all,
    fetchById: fetchLimsSampleById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsSample = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsSamplePayload; files?: File[] }) => createLimsSample(payload, files),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsSample = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: LimsSamplePayload; files?: File[] }) =>
      updateLimsSample(id, payload, files),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsSample = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsSample(selection, changeReason),
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

export const useBulkCloneLimsSample = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsSample(selection),
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

export const useRestoreLimsSample = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsSample(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
