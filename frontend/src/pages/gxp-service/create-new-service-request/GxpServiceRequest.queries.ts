import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkDeleteServiceRequest,
  createServiceRequest,
  fetchServiceRequestById,
  updateServiceRequest
} from "./GxpServiceRequest.api";
import type { GxpServiceRequestPayload } from "./GxpServiceRequest.types";

export const serviceRequestKeys = {
  all: ["gxpServiceRequest"] as const,
  list: (params: ServerListParams) => ["gxpServiceRequest", "list", params] as const,
  detail: (id: string) => ["gxpServiceRequest", "detail", id] as const
};

/** Full record for edit/view (drives the form's cascade seeds). */
export const useServiceRequestDetail = (id: string | null, enabled = true) =>
  useQuery({
    queryKey: serviceRequestKeys.detail(id ?? ""),
    queryFn: ({ signal }) => fetchServiceRequestById(id as string, signal),
    enabled: enabled && Boolean(id),
    // Always refetch on open. This detail embeds the nested application (its
    // service types, modules, etc.), which can change independently — the global
    // 30s staleTime would otherwise serve a cached copy with stale app data.
    staleTime: 0,
    // Don't refetch while the edit modal is open (e.g. when the OS file dialog
    // blurs/refocuses the window) — a mid-edit refetch would churn the form seed.
    refetchOnWindowFocus: false
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  // Refresh the list, but NOT the open record's detail. After a save the modal
  // closes immediately, so refetching that detail just fires a GET /:id that gets
  // aborted ("canceled"). The next edit-open refetches the detail fresh anyway.
  return () =>
    queryClient.invalidateQueries({
      queryKey: serviceRequestKeys.all,
      predicate: (q) => q.queryKey[1] !== "detail"
    });
};

export const useCreateServiceRequest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: GxpServiceRequestPayload; files: File[] }) =>
      createServiceRequest(payload, files),
    onSuccess: () => {
      toast("Service request created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateServiceRequest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload, files }: { id: string; payload: GxpServiceRequestPayload; files: File[] }) =>
      updateServiceRequest(id, payload, files),
    onSuccess: () => {
      toast("Service request updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteServiceRequest = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteServiceRequest(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} service requests deleted successfully.` : "Service request deleted successfully.", "success");
      invalidate();
    }
  });
};
