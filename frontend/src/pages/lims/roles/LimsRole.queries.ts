import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsRole,
  bulkCopyLimsRole,
  bulkDeleteLimsRole,
  createLimsRole,
  fetchLimsRoleOptions,
  fetchLimsRoleAudit,
  fetchLimsRolePermissions,
  restoreLimsRole,
  updateLimsRole,
  fetchLimsRoleById
} from "./LimsRole.api";
import type { LimsRolePayload } from "./LimsRole.types";

export const limsRoleKeys = {
  all: ["limsRole"] as const,
  list: (params: ServerListParams) => ["limsRole", "list", params] as const,
  audit: (id: string) => ["limsRole", "audit", id] as const,
  options: ["limsRole", "options"] as const,
  permissions: ["limsRole", "permissions"] as const
};


/** Consumed by other modules selecting this entity. */
export const useLimsRoleOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsRoleKeys.options,
    fetchPage: fetchLimsRoleOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsRoleAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsRoleKeys.audit(id ?? "none"),
    fetchPage: fetchLimsRoleAudit,
    id
  });

export const useLimsRoleById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsRoleKeys.all,
    fetchById: fetchLimsRoleById,
    id,
    enabled
  });

/** All LIMS permissions for the role form's picker — the seeded, read-only catalog. */
export const useLimsRolePermissions = () =>
  useQuery({
    queryKey: limsRoleKeys.permissions,
    queryFn: ({ signal }) => fetchLimsRolePermissions(signal)
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsRolePayload) => createLimsRole(payload),
    onSuccess: () => {
      toast("Role created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsRolePayload }) =>
      updateLimsRole(id, payload),
    onSuccess: () => {
      toast("Role updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsRole(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} roles removed successfully.`
          : "Role removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsRole(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} roles copied successfully.`
          : "Role copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

/**
 * The Copy flow's batched save (see CopyStepper) — one request creates
 * every reviewed record. A collision is warned, not rejected (server
 * auto-suffixes) — surfaced here per record.
 */
export const useBulkCopyLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsRolePayload[]) => bulkCopyLimsRole(records),
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

export const useRestoreLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsRole(id, changeReason),
    onSuccess: () => {
      toast("Role restored successfully.", "success");
      invalidate();
    }
  });
};
