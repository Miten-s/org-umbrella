import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsSupplier,
  bulkCopyLimsSupplier,
  bulkDeleteLimsSupplier,
  bulkUpdateLimsSupplier,
  createLimsSupplier,
  fetchLimsSupplierAudit,
  fetchLimsSupplierOptions,
  restoreLimsSupplier,
  updateLimsSupplier,
  fetchLimsSupplierById
} from "./LimsSupplier.api";
import type { LimsSupplierPayload } from "./LimsSupplier.types";

export const limsSupplierKeys = {
  all: ["limsSupplier"] as const,
  list: (params: ServerListParams) => ["limsSupplier", "list", params] as const,
  audit: (id: string) => ["limsSupplier", "audit", id] as const,
  options: ["limsSupplier", "options"] as const
};

export const useLimsSupplierOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsSupplierKeys.options,
    fetchPage: fetchLimsSupplierOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsSupplierAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsSupplierKeys.audit(id ?? "none"),
    fetchPage: fetchLimsSupplierAudit,
    id
  });

export const useLimsSupplierById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsSupplierKeys.all,
    fetchById: fetchLimsSupplierById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsSupplier = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsSupplierPayload; files?: File[] }) =>
      createLimsSupplier(payload, files),
    onSuccess: () => {
      toast("Supplier created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsSupplier = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      files
    }: {
      id: string;
      payload: LimsSupplierPayload;
      files?: File[];
    }) => updateLimsSupplier(id, payload, files),
    onSuccess: () => {
      toast("Supplier updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsSupplier = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsSupplier(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} suppliers removed successfully.`
          : "Supplier removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsSupplier = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsSupplier(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} suppliers copied successfully.`
          : "Supplier copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

/** The Copy flow's batched save (CopyStepper): one request creates every reviewed
 * record; a collision is warned, not rejected. */
export const useBulkCopyLimsSupplier = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsSupplierPayload[]) => bulkCopyLimsSupplier(records),
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

export const useBulkUpdateLimsSupplier = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsSupplierPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsSupplier(updates, changeReason),
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

export const useRestoreLimsSupplier = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsSupplier(id, changeReason),
    onSuccess: () => {
      toast("Supplier restored successfully.", "success");
      invalidate();
    }
  });
};
