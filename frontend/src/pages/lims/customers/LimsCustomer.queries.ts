import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsCustomer,
  bulkDeleteLimsCustomer,
  createLimsCustomer,
  fetchLimsCustomerAudit,
  fetchLimsCustomerOptions,
  restoreLimsCustomer,
  updateLimsCustomer,
  fetchLimsCustomerById
} from "./LimsCustomer.api";
import type { LimsCustomerPayload } from "./LimsCustomer.types";

export const limsCustomerKeys = {
  all: ["limsCustomer"] as const,
  list: (params: ServerListParams) => ["limsCustomer", "list", params] as const,
  audit: (id: string) => ["limsCustomer", "audit", id] as const,
  options: ["limsCustomer", "options"] as const
};

export const useLimsCustomerOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsCustomerKeys.options,
    fetchPage: fetchLimsCustomerOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsCustomerAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsCustomerKeys.audit(id ?? "none"),
    fetchPage: fetchLimsCustomerAudit,
    id
  });

export const useLimsCustomerById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsCustomerKeys.all,
    fetchById: fetchLimsCustomerById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsCustomer = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsCustomerPayload; files?: File[] }) =>
      createLimsCustomer(payload, files),
    onSuccess: () => {
      toast("Customer created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsCustomer = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      files
    }: {
      id: string;
      payload: LimsCustomerPayload;
      files?: File[];
    }) => updateLimsCustomer(id, payload, files),
    onSuccess: () => {
      toast("Customer updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsCustomer = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsCustomer(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} customers removed successfully.`
          : "Customer removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsCustomer = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsCustomer(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} customers copied successfully.`
          : "Customer copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useRestoreLimsCustomer = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsCustomer(id, changeReason),
    onSuccess: () => {
      toast("Customer restored successfully.", "success");
      invalidate();
    }
  });
};
