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
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "@/lib/toast";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsUserList } from "./LimsUser.api";
import { getLimsUserColumns } from "./LimsUser.columns";
import {
  limsUserKeys,
  useBulkCloneLimsUser,
  useBulkDeleteLimsUser,
  useCreateLimsUser,
  useLimsUserAudit,
  useRestoreLimsUser,
  useUpdateLimsUser,
  useLimsUserById
} from "./LimsUser.queries";
import LimsUserForm, { type LimsUserFormMode } from "./LimsUserForm";
import type { LimsUser, LimsUserPayload } from "./LimsUser.types";

/** LimsUser list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsUserList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  // Removing your own Lab User row is a total, self-inflicted lockout — no
  // LIMS access means no way to use this app's own Restore to undo it. The
  // API rejects it either way (lims-user.routes.ts); this just keeps the
  // option from being offered in the first place.
  const currentUser = useCurrentUser();
  const isSelf = useCallback(
    (row: LimsUser | undefined) =>
      Boolean(currentUser?.id) && row?.userId === currentUser?.id,
    [currentUser?.id]
  );

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsUserFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsUser, LimsUserPayload>();
  const auditQuery = useLimsUserAudit(compliance.auditRow?.id);
  const detailQuery = useLimsUserById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsUserList>[1], signal?: AbortSignal) =>
      fetchLimsUserList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsUser>({
    entity: "limsUser",
    queryKey: [...limsUserKeys.all, { includeRemoved }],
    fetchList
  });
  console.log("table", table);

  const create = useCreateLimsUser();
  const update = useUpdateLimsUser();
  const bulkClone = useBulkCloneLimsUser();
  const bulkDelete = useBulkDeleteLimsUser();
  const restore = useRestoreLimsUser();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsUserColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsUserFormMode, row: LimsUser | null) => {
      setFormMode(mode);
      setActiveId(row?.id ?? null);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsUserPayload) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload);
      closeModal();
      return;
    }
    await create.mutateAsync(payload);
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await update.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason }
    });
    compliance.clearUpdate();
    setActiveId(null);
    setFormMode("create");
  };

  const label = (row: LimsUser) => String(row.userName ?? row.id);

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_USER,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_USER,
        onClick: (selection, count) => {
          // "all" (select-across-pages) mode can't be filtered client-side —
          // if it happens to include the caller's own row, the API's own
          // guard (lims-user.routes.ts) rejects the whole batch rather than
          // silently locking them out.
          let filtered = selection;
          let excludedSelf = false;
          if (selection.mode === "ids") {
            const rowsById = new Map(table.rows.map((row) => [row.id, row]));
            const ids = selection.ids.filter((id) => !isSelf(rowsById.get(id)));
            excludedSelf = ids.length !== selection.ids.length;
            filtered = { ...selection, ids };
          }
          // Selection was ONLY your own row — nothing left to confirm.
          // Without this, an empty-but-real confirmation dialog still
          // opened, reachable even though it could never actually remove
          // anything.
          if (
            filtered.mode === "ids" &&
            filtered.ids.length === 0 &&
            excludedSelf
          ) {
            toast(
              "You cannot remove your own Lab User record. Ask another administrator to do it.",
              "error"
            );
            return;
          }
          compliance.requestDelete(
            filtered,
            excludedSelf ? count - 1 : count,
            filtered.mode === "ids"
              ? table.rows
                  .filter((row) => filtered.ids.includes(row.id))
                  .map(label)
              : []
          );
        }
      }
    ],
    [bulkClone, compliance, isSelf, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsUser>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsUser") }),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_USER,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_USER,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_USER,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_USER,
        onClick: (row) => bulkClone.mutate({ mode: "ids", ids: [row.id] })
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_USER,
        hidden: (row: LimsUser) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_USER,
        hidden: (row: LimsUser) => Boolean(row.isRemoved) || isSelf(row),
        onClick: (row) =>
          compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [
            label(row)
          ])
      }
    ],
    [bulkClone, compliance, isSelf, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsUser>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsUsers")}
        searchPlaceholder={t("search", { entity: t("limsUsers") })}
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
            label: t("create", { entity: t("limsUser") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_USER,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoUsers") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1100px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsUserForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={create.isPending || update.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsUser")}
        entityLabelPlural={t("limsUsers")}
        getRecordLabel={label}
        updating={update.isPending}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
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
            await restore.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsUserList;
