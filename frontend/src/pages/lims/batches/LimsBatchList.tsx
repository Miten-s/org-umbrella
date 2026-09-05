import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { toast } from "@/lib/toast";
import { idsSelection } from "@/lib/query/listTypes";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsBatchById, fetchLimsBatchList } from "./LimsBatch.api";
import { getLimsBatchColumns } from "./LimsBatch.columns";
import {
  limsBatchKeys,
  useBulkCloneLimsBatch,
  useBulkCopyLimsBatch,
  useBulkDeleteLimsBatch,
  useBulkUpdateLimsBatch,
  useCreateLimsBatch,
  useLimsBatchAudit,
  useRestoreLimsBatch,
  useBulkRestoreLimsBatch,
  useUpdateLimsBatch,
  useLimsBatchById
} from "./LimsBatch.queries";
import LimsBatchForm, { type LimsBatchFormMode } from "./LimsBatchForm";
import type { LimsBatch, LimsBatchPayload } from "./LimsBatch.types";

/** LimsBatch list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsBatchList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsBatchFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsBatch, LimsBatchPayload>();
  const auditQuery = useLimsBatchAudit(compliance.auditRow?.id);
  const detailQuery = useLimsBatchById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsBatchList>[1], signal?: AbortSignal) =>
      fetchLimsBatchList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsBatch>({
    entity: "limsBatch",
    queryKey: [...limsBatchKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsBatch();
  const update = useUpdateLimsBatch();
  const bulkClone = useBulkCloneLimsBatch();
  const bulkCopy = useBulkCopyLimsBatch();
  const bulkDelete = useBulkDeleteLimsBatch();
  const bulkUpdate = useBulkUpdateLimsBatch();
  const restore = useRestoreLimsBatch();
  const bulkRestoreBatch = useBulkRestoreLimsBatch();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending ||
    bulkRestoreBatch.isPending;

  const columnDefs = useMemo(() => getLimsBatchColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsBatchFormMode, row: LimsBatch | null) => {
      setFormMode(mode);
      setActiveId(row?.id ?? null);
      openModal();
    },
    [openModal]
  );

  const openCopy = useCallback(
    (ids: string[]) => {
      setCopyIds(ids);
      openModal();
    },
    [openModal]
  );

  const openView = useCallback(
    (ids: string[]) => {
      setViewIds(ids);
      openModal();
    },
    [openModal]
  );

  const openEdit = useCallback(
    (ids: string[]) => {
      setEditIds(ids);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: LimsBatchPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (updates: { id: string; payload: LimsBatchPayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsBatchPayload, files: File[]) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload, files);
      closeModal();
      return;
    }
    await create.mutateAsync({ payload, files });
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await update.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason },
      files: pending.files
    });
    compliance.clearUpdate();
    setActiveId(null);
    setFormMode("create");
  };

  const label = (row: LimsBatch) => String(row.batchId ?? row.batchName ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_BATCH,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("viewBulkFilterUnsupported"), "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_BATCH,
        onClick: async (selection) => {
          if (selection.mode === "ids") {
            openCopy(selection.ids);
            return;
          }
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "edit",
        label: () => t("edit"),
        icon: PencilIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.UPDATE_BATCH,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "restore",
        label: () => t("limsRestore"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.UPDATE_BATCH,
        // Only offered when the current selection actually has something removed —
        // an all-active selection would otherwise fire a no-op restore request.
        hidden: (rows) => !rows.some((row) => row.isRemoved),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          compliance.requestBulkRestore(
            selection.ids,
            table.rows
              .filter((row) => selection.ids.includes(row.id))
              .map(label)
          );
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_BATCH,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map(label)
              : []
          )
      }
    ],
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsBatch>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_BATCH,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_BATCH,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_BATCH,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_BATCH,
        onClick: (row) => openCopy([row.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_BATCH,
        hidden: (row: LimsBatch) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_BATCH,
        hidden: (row: LimsBatch) => Boolean(row.isRemoved),
        onClick: (row) =>
          compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [
            label(row)
          ])
      }
    ],
    [compliance, openCopy, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsBatch>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsBatches")}
        searchPlaceholder={t("search", { entity: t("limsBatches") })}
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
            label: t("create", { entity: t("limsBatch") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_BATCH,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoBatches") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1100px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsBatch, LimsBatchPayload>
            ids={copyIds}
            fetchById={fetchLimsBatchById}
            FormComponent={LimsBatchForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsBatch")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsBatch>
            ids={viewIds}
            fetchById={fetchLimsBatchById}
            FormComponent={LimsBatchForm}
            onClose={handleCloseForm}
            entityLabel={t("limsBatch")}
          />
        ) : editIds ? (
          <EditStepper<LimsBatch, LimsBatchPayload>
            ids={editIds}
            fetchById={fetchLimsBatchById}
            FormComponent={LimsBatchForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsBatch")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsBatchForm
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
        entityLabel={t("limsBatch")}
        entityLabelPlural={t("limsBatches")}
        getRecordLabel={label}
        updating={update.isPending}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        bulkRestoring={bulkRestoreBatch.isPending}
        bulkUpdating={bulkUpdate.isPending}
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onUpdate={confirmUpdate}
        onBulkUpdate={async (reason) => {
          const pending = compliance.pendingBulkUpdate;
          if (pending) {
            await bulkUpdate.mutateAsync({ updates: pending.updates, changeReason: reason });
            table.clearSelection();
          }
          compliance.clearBulkUpdate();
        }}
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
        onBulkRestore={async (reason) => {
          const pending = compliance.pendingBulkRestore;
          if (pending) {
            await bulkRestoreBatch.mutateAsync({
              selection: { mode: "ids", ids: pending.ids },
              changeReason: reason
            });
            table.clearSelection();
          }
          compliance.clearBulkRestore();
        }}
      />
    </div>
  );
};

export default LimsBatchList;
