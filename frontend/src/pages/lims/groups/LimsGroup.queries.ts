import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsGroup,
  bulkCopyLimsGroup,
  bulkDeleteLimsGroup,
  bulkRestoreLimsGroup,
  bulkUpdateLimsGroup,
  createLimsGroup,
  fetchLimsGroupAudit,
  fetchLimsGroupOptions,
  restoreLimsGroup,
  updateLimsGroup,
  fetchLimsGroupById
} from "./LimsGroup.api";
import type { LimsGroupPayload } from "./LimsGroup.types";

export const limsGroupKeys = {
  all: ["limsGroup"] as const,
  list: (params: ServerListParams) => ["limsGroup", "list", params] as const,
  audit: (id: string) => ["limsGroup", "audit", id] as const,
  options: ["limsGroup", "options"] as const
};

/** Consumed by every module with a Lab Group dropdown. */
export const useLimsGroupOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsGroupKeys.options,
    fetchPage: fetchLimsGroupOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsGroupAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsGroupKeys.audit(id ?? "none"),
    fetchPage: fetchLimsGroupAudit,
    id
  });

export const useLimsGroupById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsGroupKeys.all,
    fetchById: fetchLimsGroupById,
    id,
    enabled
  });

const useInvalidateLimsGroups = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsGroup = () => {
  const invalidate = useInvalidateLimsGroups();
  return useMutation({
    mutationFn: (payload: LimsGroupPayload) => createLimsGroup(payload),
    onSuccess: () => {
      toast("Lab group created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsGroup = () => {
  const invalidate = useInvalidateLimsGroups();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsGroupPayload }) =>
      updateLimsGroup(id, payload),
    onSuccess: () => {
      toast("Lab group updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsGroup = () => {
  const invalidate = useInvalidateLimsGroups();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsGroup(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} lab groups removed successfully.`
          : "Lab group removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkRestoreLimsGroup = () => {
  const invalidate = useInvalidateLimsGroups();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkRestoreLimsGroup(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} lab groups restored successfully.`
          : "Lab group restored successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsGroup = () => {
  const invalidate = useInvalidateLimsGroups();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsGroup(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} lab groups copied successfully.`
          : "Lab group copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

/** The Copy flow's batched save (CopyStepper): one request creates every reviewed record;
 * a `groupId` collision is warned, not rejected, per record. */
export const useBulkCopyLimsGroup = () => {
  const invalidate = useInvalidateLimsGroups();
  return useMutation({
    mutationFn: (records: LimsGroupPayload[]) => bulkCopyLimsGroup(records),
    onSuccess: (data) => {
      const warnings = data.results.filter((r) => r.warning);
      toast(
        data.count > 1
          ? `${data.count} lab groups copied successfully.`
          : "Lab group copied successfully.",
        "success"
      );
      if (warnings.length) {
        toast(
          warnings.length === 1
            ? warnings[0].warning!
            : `${warnings.length} of ${data.count} kept their original ID — renamed to stay unique.`,
          "info",
          { duration: 6000 }
        );
      }
      invalidate();
    }
  });
};

export const useBulkUpdateLimsGroup = () => {
  const invalidate = useInvalidateLimsGroups();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsGroupPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsGroup(updates, changeReason),
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

export const useRestoreLimsGroup = () => {
  const invalidate = useInvalidateLimsGroups();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsGroup(id, changeReason),
    onSuccess: () => {
      toast("Lab group restored successfully.", "success");
      invalidate();
    }
  });
};
