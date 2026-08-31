import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsTest,
  bulkCopyLimsTest,
  bulkDeleteLimsTest,
  bulkUpdateLimsTest,
  createLimsTest,
  fetchLimsTestAudit,
  fetchLimsTestOptions,
  restoreLimsTest,
  updateLimsTest,
  fetchLimsTestById
} from "./LimsTest.api";
import type { LimsTestPayload } from "./LimsTest.types";

export const limsTestKeys = {
  all: ["limsTest"] as const,
  list: (params: ServerListParams) => ["limsTest", "list", params] as const,
  audit: (id: string) => ["limsTest", "audit", id] as const,
  options: ["limsTest", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsTestOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsTestKeys.options,
    fetchPage: fetchLimsTestOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsTestAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsTestKeys.audit(id ?? "none"),
    fetchPage: fetchLimsTestAudit,
    id
  });

export const useLimsTestById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsTestKeys.all,
    fetchById: fetchLimsTestById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsTest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsTestPayload; files?: File[] }) => createLimsTest(payload, files),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsTest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: LimsTestPayload; files?: File[] }) =>
      updateLimsTest(id, payload, files),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsTest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsTest(selection, changeReason),
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

export const useBulkCloneLimsTest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsTest(selection),
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
export const useBulkCopyLimsTest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsTestPayload[]) => bulkCopyLimsTest(records),
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

export const useBulkUpdateLimsTest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsTestPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsTest(updates, changeReason),
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

export const useRestoreLimsTest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsTest(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
