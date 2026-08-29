import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsTestGroup,
  bulkCopyLimsTestGroup,
  bulkDeleteLimsTestGroup,
  createLimsTestGroup,
  fetchLimsTestGroupOptions,
  fetchLimsTestGroupAudit,
  restoreLimsTestGroup,
  updateLimsTestGroup,
  fetchLimsTestGroupById
} from "./LimsTestGroup.api";
import type { LimsTestGroupPayload } from "./LimsTestGroup.types";

export const limsTestGroupKeys = {
  all: ["limsTestGroup"] as const,
  list: (params: ServerListParams) => ["limsTestGroup", "list", params] as const,
  audit: (id: string) => ["limsTestGroup", "audit", id] as const,
  options: ["limsTestGroup", "options"] as const
};


/** Consumed by other modules selecting this entity. */
export const useLimsTestGroupOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsTestGroupKeys.options,
    fetchPage: fetchLimsTestGroupOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsTestGroupAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsTestGroupKeys.audit(id ?? "none"),
    fetchPage: fetchLimsTestGroupAudit,
    id
  });

export const useLimsTestGroupById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsTestGroupKeys.all,
    fetchById: fetchLimsTestGroupById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsTestGroupPayload) => createLimsTestGroup(payload),
    onSuccess: () => {
      toast("Test group created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsTestGroupPayload }) =>
      updateLimsTestGroup(id, payload),
    onSuccess: () => {
      toast("Test group updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsTestGroup(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} test groups removed successfully.`
          : "Test group removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsTestGroup(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} test groups copied successfully.`
          : "Test group copied successfully.",
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
export const useBulkCopyLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsTestGroupPayload[]) => bulkCopyLimsTestGroup(records),
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

export const useRestoreLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsTestGroup(id, changeReason),
    onSuccess: () => {
      toast("Test group restored successfully.", "success");
      invalidate();
    }
  });
};
