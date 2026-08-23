import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsLocation,
  bulkDeleteLimsLocation,
  createLimsLocation,
  fetchLimsLocationAudit,
  fetchLimsLocationOptions,
  restoreLimsLocation,
  updateLimsLocation,
  fetchLimsLocationById
} from "./LimsLocation.api";
import type { LimsLocationPayload } from "./LimsLocation.types";

export const limsLocationKeys = {
  all: ["limsLocation"] as const,
  list: (params: ServerListParams) => ["limsLocation", "list", params] as const,
  detail: (id: string) => ["limsLocation", "detail", id] as const,
  audit: (id: string) => ["limsLocation", "audit", id] as const,
  options: ["limsLocation", "options"] as const
};

/** Audit trail for one record; only fetched while the dialog is open. */
export const useLimsLocationAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsLocationKeys.audit(id ?? "none"),
    fetchPage: fetchLimsLocationAudit,
    id
  });

export const useLimsLocationById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsLocationKeys.all,
    fetchById: fetchLimsLocationById,
    id,
    enabled
  });

/** Exposed so other LIMS modules (Stock, Instruments, …) can select a location. */
export const useLimsLocationOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsLocationKeys.options,
    fetchPage: fetchLimsLocationOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

const useInvalidateLimsLocations = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// MIGRATION.md Rule 2: exactly one SUCCESS toast per action, owned here.
// Never add an onError toast — the axios interceptor owns error toasts.

export const useCreateLimsLocation = () => {
  const invalidate = useInvalidateLimsLocations();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsLocationPayload; files?: File[] }) =>
      createLimsLocation(payload, files),
    onSuccess: () => {
      toast("Storage location created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsLocation = () => {
  const invalidate = useInvalidateLimsLocations();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      files
    }: {
      id: string;
      payload: LimsLocationPayload;
      files?: File[];
    }) => updateLimsLocation(id, payload, files),
    onSuccess: () => {
      toast("Storage location updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsLocation = () => {
  const invalidate = useInvalidateLimsLocations();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsLocation(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} storage locations removed successfully.`
          : "Storage location removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsLocation = () => {
  const invalidate = useInvalidateLimsLocations();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsLocation(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} storage locations copied successfully.`
          : "Storage location copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useRestoreLimsLocation = () => {
  const invalidate = useInvalidateLimsLocations();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsLocation(id, changeReason),
    onSuccess: () => {
      toast("Storage location restored successfully.", "success");
      invalidate();
    }
  });
};
