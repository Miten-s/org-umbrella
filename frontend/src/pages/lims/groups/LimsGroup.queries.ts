import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { extractList } from "@/utils/listResponse";
import type { LimsAuditEntry } from "@/components/data/AuditTrailDialog";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsGroup,
  bulkDeleteLimsGroup,
  createLimsGroup,
  fetchLimsGroupAudit,
  fetchLimsGroupOptions,
  restoreLimsGroup,
  updateLimsGroup
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
  useQuery({
    queryKey: limsGroupKeys.audit(id ?? "none"),
    queryFn: async ({ signal }) =>
      extractList<LimsAuditEntry>(await fetchLimsGroupAudit(id as string, signal), [
        "audit",
        "auditTrail",
        "entries"
      ]),
    enabled: Boolean(id)
  });

const useInvalidateLimsGroups = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: limsGroupKeys.all });
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
