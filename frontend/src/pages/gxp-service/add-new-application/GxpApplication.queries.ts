import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { BulkSelection, ListResult, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneApplication,
  bulkCopyApplication,
  bulkDeleteApplication,
  bulkRestoreApplication,
  bulkUpdateApplication,
  createApplication,
  disableApplication,
  enableApplication,
  fetchApplicationById,
  updateApplication
} from "./GxpApplication.api";
import type { GxpApplication, GxpApplicationPayload } from "./GxpApplication.types";

export const applicationKeys = {
  all: ["gxpApplication"] as const,
  list: (params: ServerListParams) => ["gxpApplication", "list", params] as const,
  detail: (id: string) => ["gxpApplication", "detail", id] as const
};

/** Full record for edit/view seeding (getApplicationById). */
export const useApplicationDetail = (id: string | null, enabled = true) =>
  useQuery({
    queryKey: applicationKeys.detail(id ?? ""),
    queryFn: ({ signal }) => fetchApplicationById(id as string, signal),
    enabled: enabled && Boolean(id),
    // Always refetch on open so the edit form seeds from the latest record (the
    // global 30s staleTime would otherwise serve a cached, stale copy).
    staleTime: 0,
    // Don't refetch while the edit modal is open (e.g. when the OS file dialog
    // blurs/refocuses the window) — a mid-edit refetch would churn the form seed.
    refetchOnWindowFocus: false
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  // Refresh the list, but NOT the open record's detail. After a save the modal
  // closes immediately, so refetching that detail just fires a GET /:id that gets
  // aborted ("canceled") and logs noise. The next edit-open refetches it fresh.
  return () =>
    queryClient.invalidateQueries({
      queryKey: applicationKeys.all,
      predicate: (q) => q.queryKey[1] !== "detail"
    });
};

export const useCreateApplication = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: GxpApplicationPayload; files: File[] }) =>
      createApplication(payload, files),
    onSuccess: () => {
      toast("Application created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateApplication = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: GxpApplicationPayload; files: File[] }) =>
      updateApplication(id, payload, files),
    onSuccess: () => {
      toast("Application updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteApplication = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteApplication(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} applications deleted successfully.` : "Application deleted successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkCloneApplication = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneApplication(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} applications copied successfully.` : "Application copied successfully.", "success");
      invalidate();
    }
  });
};

/** The Copy flow's batched save (CopyStepper): one request creates every
 * reviewed record; a name collision is warned, not rejected. */
export const useBulkCopyApplication = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: GxpApplicationPayload[]) => bulkCopyApplication(records),
    onSuccess: (data) => {
      toast(
        data.length > 1 ? `${data.length} applications copied successfully.` : "Application copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkUpdateApplication = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (updates: { id: string; payload: GxpApplicationPayload }[]) => bulkUpdateApplication(updates),
    onSuccess: (data) => {
      toast(
        data.results.length > 1
          ? `${data.results.length} applications updated successfully.`
          : "Application updated successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkRestoreApplication = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkRestoreApplication(selection),
    onSuccess: (data) => {
      toast(
        data.count > 1 ? `${data.count} applications restored successfully.` : "Application restored successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useToggleApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (application: GxpApplication) =>
      application.status === "enabled" ? disableApplication(application.id) : enableApplication(application.id),
    onMutate: async (application) => {
      await queryClient.cancelQueries({ queryKey: applicationKeys.all });
      const nextStatus = application.status === "enabled" ? "disabled" : "enabled";
      const snapshots = queryClient.getQueriesData<ListResult<GxpApplication>>({ queryKey: applicationKeys.all });
      snapshots.forEach(([key, data]) => {
        if (!data?.rows) return;
        queryClient.setQueryData<ListResult<GxpApplication>>(key, {
          ...data,
          rows: data.rows.map((row) => (row.id === application.id ? { ...row, status: nextStatus } : row))
        });
      });
      return { snapshots };
    },
    onSuccess: (_data, application) =>
      toast(application.status === "enabled" ? "Application disabled successfully." : "Application enabled successfully.", "success"),
    onError: (_error, _application, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: applicationKeys.all })
  });
};
