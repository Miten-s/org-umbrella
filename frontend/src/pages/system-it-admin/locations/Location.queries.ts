import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLocation,
  bulkDeleteLocation,
  createLocation,
  deleteLocation,
  fetchLocationOptions,
  resolveLocationByIds,
  updateLocation
} from "./Location.api";
import type { LocationPayload } from "./Location.types";

export const locationKeys = {
  all: ["location"] as const,
  list: (params: ServerListParams) => ["location", "list", params] as const,
  detail: (id: string) => ["location", "detail", id] as const,
  options: ["location", "options"] as const
};

/** Bound options hook for AsyncSelect consumers selecting a location. */
export const useLocationOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: locationKeys.options,
    fetchPage: fetchLocationOptions,
    resolveByIds: resolveLocationByIds,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

const useInvalidateLocations = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: locationKeys.all });
};

export const useCreateLocation = () => {
  const invalidate = useInvalidateLocations();
  return useMutation({
    mutationFn: (payload: LocationPayload) => createLocation(payload),
    onSuccess: () => {
      toast("Location created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLocation = () => {
  const invalidate = useInvalidateLocations();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LocationPayload }) => updateLocation(id, payload),
    onSuccess: () => {
      toast("Location updated successfully.", "success");
      invalidate();
    }
  });
};

export const useDeleteLocation = () => {
  const invalidate = useInvalidateLocations();
  return useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => invalidate()
  });
};

export const useBulkDeleteLocation = () => {
  const invalidate = useInvalidateLocations();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteLocation(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} locations deleted successfully.` : "Location deleted successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkCloneLocation = () => {
  const invalidate = useInvalidateLocations();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLocation(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} locations copied successfully.` : "Location copied successfully.", "success");
      invalidate();
    }
  });
};
