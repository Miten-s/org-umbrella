import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsRoleList } from "./LimsRole.api";
import { getLimsRoleColumns } from "./LimsRole.columns";
import {
  limsRoleKeys,
  useBulkCloneLimsRole,
  useBulkDeleteLimsRole,
  useCreateLimsRole,
  useLimsRoleAudit,
  useRestoreLimsRole,
  useUpdateLimsRole,
  useLimsRoleById
} from "./LimsRole.queries";
import LimsRoleForm, { type LimsRoleFormMode } from "./LimsRoleForm";
import type { LimsRole, LimsRolePayload } from "./LimsRole.types";

/**
 * LIMS Lab Roles — Track A module.
 *
 * Permissions themselves are a seeded, read-only catalog (see LimsRole.api.ts) —
 * roles only assign a subset of it via PermissionPicker.
 */
const LimsRoleList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsRoleFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsRole, LimsRolePayload>();
  const auditQuery = useLimsRoleAudit(compliance.auditRow?.id);
  const detailQuery = useLimsRoleById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsRoleList>[1], signal?: AbortSignal) =>
      fetchLimsRoleList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsRole>({
    entity: "limsRole",
    queryKey: [...limsRoleKeys.all, { includeRemoved }],
    fetchList
  });

  const createRole = useCreateLimsRole();
  const updateRole = useUpdateLimsRole();
  const bulkClone = useBulkCloneLimsRole();
  const bulkDelete = useBulkDeleteLimsRole();
  const restoreRole = useRestoreLimsRole();

  const busy =
    createRole.isPending ||
    updateRole.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restoreRole.isPending;

  const columnDefs = useMemo(() => getLimsRoleColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsRoleFormMode, role: LimsRole | null) => {
      setFormMode(mode);
      setActiveId(role?.id ?? null);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsRolePayload) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload);
      closeModal();
      return;
    }
    await createRole.mutateAsync(payload);
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updateRole.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason }
    });
    compliance.clearUpdate();
    setActiveId(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "delete",
        label: (count) => (count > 1 ? "Remove roles" : "Remove role"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_ROLE,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map((row) => row.name)
              : []
          )
      }
    ],
    [compliance, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsRole>[]>(
    () => [
      {
        key: "view",
        label: "View role",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_ROLE,
        onClick: (role) => openForm("view", role)
      },
      {
        key: "edit",
        label: "Edit role",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_ROLE,
        onClick: (role) => openForm("edit", role)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_ROLE,
        onClick: (role) => compliance.openAudit(role)
      },
      {
        key: "clone",
        label: "Copy role",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_ROLE,
        onClick: (role) => bulkClone.mutate({ mode: "ids", ids: [role.id] })
      },
      {
        key: "restore",
        label: "Restore role",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_ROLE,
        hidden: (role: LimsRole) => !role.isRemoved,
        onClick: (role) => compliance.requestRestore(role)
      },
      {
        key: "delete",
        label: "Remove role",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_ROLE,
        hidden: (role: LimsRole) => Boolean(role.isRemoved),
        onClick: (role) =>
          compliance.requestDelete({ mode: "ids", ids: [role.id] }, 1, [
            role.name
          ])
      }
    ],
    [bulkClone, compliance, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsRole>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsRoles")}
        searchPlaceholder="Search roles…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        titleExtra={
          <Switch
            checked={includeRemoved}
            onChange={setIncludeRemoved}
            label={t("limsShowRemoved")}
          />
        }
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("limsRole") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_ROLE,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoRoles") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
      >
        {formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsRoleForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createRole.isPending || updateRole.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="role"
        entityLabelPlural="roles"
        getRecordLabel={(row) => row.roleId || row.name}
        updating={updateRole.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreRole.isPending}
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onUpdate={confirmUpdate}
        onDelete={async (reason) => {
          const pending = compliance.pendingDelete;
          if (pending) {
            await bulkDelete.mutateAsync({
              selection: pending.selection,
              changeReason: reason
            });
            table.clearSelection();
          }
          compliance.clearDelete();
        }}
        onRestore={async (reason) => {
          const pending = compliance.pendingRestore;
          if (pending) {
            await restoreRole.mutateAsync({
              id: pending.id,
              changeReason: reason
            });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsRoleList;
