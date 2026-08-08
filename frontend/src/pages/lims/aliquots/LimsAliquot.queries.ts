import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { extractList } from "@/utils/listResponse";
import type { LimsAuditEntry } from "@/components/data/AuditTrailDialog";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsAliquot,
  bulkDeleteLimsAliquot,
  createLimsAliquot,
  fetchLimsAliquotAudit,
  fetchLimsAliquotOptions,
  restoreLimsAliquot,
  updateLimsAliquot
} from "./LimsAliquot.api";
import type { LimsAliquotPayload } from "./LimsAliquot.types";

export const limsAliquotKeys = {
  all: ["limsAliquot"] as const,
  list: (params: ServerListParams) => ["limsAliquot", "list", params] as const,
  audit: (id: string) => ["limsAliquot", "audit", id] as const,
  options: ["limsAliquot", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsAliquotOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsAliquotKeys.options,
    fetchPage: fetchLimsAliquotOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsAliquotAudit = (id?: string) =>
  useQuery({
    queryKey: limsAliquotKeys.audit(id ?? "none"),
    queryFn: async ({ signal }) =>
      extractList<LimsAuditEntry>(await fetchLimsAliquotAudit(id as string, signal), [
        "audit",
        "auditTrail",
        "entries"
      ]),
    enabled: Boolean(id)
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: limsAliquotKeys.all });
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsAliquotPayload) => createLimsAliquot(payload),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsAliquotPayload }) => updateLimsAliquot(id, payload),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsAliquot(selection, changeReason),
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

export const useBulkCloneLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsAliquot(selection),
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

export const useRestoreLimsAliquot = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsAliquot(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
