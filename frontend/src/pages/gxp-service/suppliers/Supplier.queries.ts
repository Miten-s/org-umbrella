import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import type { BulkSelection, ListResult, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneSupplier,
  bulkCopySupplier,
  bulkDeleteSupplier,
  bulkRestoreSupplier,
  bulkUpdateSupplier,
  createSupplier,
  deleteSupplier,
  disableSupplier,
  enableSupplier,
  fetchSupplierById,
  fetchSupplierOptions,
  updateSupplier
} from "./Supplier.api";
import type { Supplier, SupplierPayload } from "./Supplier.types";

export const supplierKeys = {
  all: ["supplier"] as const,
  list: (params: ServerListParams) => ["supplier", "list", params] as const,
  detail: (id: string) => ["supplier", "detail", id] as const,
  options: ["supplier", "options"] as const
};

export const useSupplierOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({
    queryKey: supplierKeys.options,
    fetchPage: fetchSupplierOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useSupplierById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: supplierKeys.all,
    fetchById: fetchSupplierById,
    id,
    enabled
  });

const useInvalidateSuppliers = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: supplierKeys.all });
};

export const useCreateSupplier = () => {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: (payload: SupplierPayload) => createSupplier(payload),
    onSuccess: () => {
      toast("Supplier created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateSupplier = () => {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SupplierPayload }) =>
      updateSupplier(id, payload),
    onSuccess: () => {
      toast("Supplier updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteSupplier = () => {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteSupplier(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} suppliers deleted successfully.` : "Supplier deleted successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkCloneSupplier = () => {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneSupplier(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} suppliers copied successfully.` : "Supplier copied successfully.", "success");
      invalidate();
    }
  });
};

/** The Copy flow's batched save (CopyStepper): one request creates every
 * reviewed record; a name collision is warned, not rejected. */
export const useBulkCopySupplier = () => {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: (records: SupplierPayload[]) => bulkCopySupplier(records),
    onSuccess: (data) => {
      toast(
        data.length > 1 ? `${data.length} suppliers copied successfully.` : "Supplier copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkUpdateSupplier = () => {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: (updates: { id: string; payload: SupplierPayload }[]) => bulkUpdateSupplier(updates),
    onSuccess: (data) => {
      toast(
        data.results.length > 1 ? `${data.results.length} suppliers updated successfully.` : "Supplier updated successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkRestoreSupplier = () => {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkRestoreSupplier(selection),
    onSuccess: (data) => {
      toast(data.count > 1 ? `${data.count} suppliers restored successfully.` : "Supplier restored successfully.", "success");
      invalidate();
    }
  });
};

/**
 * Toggle enable/disable with an OPTIMISTIC status flip (STANDARDS.md §9),
 * preserving the pre-migration snappy toggle. Patches every cached supplier
 * list and rolls back on error.
 *
 * Toast ownership (MIGRATION.md Rule 2): the mutation owns the single SUCCESS
 * toast; it does NOT toast on error — the axios interceptor is the sole owner of
 * error toasts (shows the server message once). No duplicate.
 */
export const useToggleSupplierStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (supplier: Supplier) =>
      supplier.status === "enabled" ? disableSupplier(supplier.id) : enableSupplier(supplier.id),
    onMutate: async (supplier) => {
      await queryClient.cancelQueries({ queryKey: supplierKeys.all });
      const nextStatus = supplier.status === "enabled" ? "disabled" : "enabled";
      const snapshots = queryClient.getQueriesData<ListResult<Supplier>>({ queryKey: supplierKeys.all });
      snapshots.forEach(([key, data]) => {
        if (!data?.rows) return;
        queryClient.setQueryData<ListResult<Supplier>>(key, {
          ...data,
          rows: data.rows.map((row) => (row.id === supplier.id ? { ...row, status: nextStatus } : row))
        });
      });
      return { snapshots };
    },
    onSuccess: (_data, supplier) =>
      toast(
        supplier.status === "enabled" ? "Supplier disabled successfully." : "Supplier enabled successfully.",
        "success"
      ),
    // No onError toast — interceptor owns error toasts. Roll back optimistic state only.
    onError: (_error, _supplier, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: supplierKeys.all })
  });
};

export const useDeleteSupplier = () => {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => invalidate()
  });
};
