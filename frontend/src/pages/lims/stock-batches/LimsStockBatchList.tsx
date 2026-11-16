import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NEW_RECORD, recordPageUrl } from "@/components/data/recordPage";
import { PageUrl } from "@/types/utils.types";

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
import {
  fetchLimsStockBatchById,
  fetchLimsStockBatchList
} from "./LimsStockBatch.api";
import { getLimsStockBatchColumns } from "./LimsStockBatch.columns";
import {
  limsStockBatchKeys,
  useBulkCloneLimsStockBatch,
  useBulkCopyLimsStockBatch,
  useBulkDeleteLimsStockBatch,
  useBulkUpdateLimsStockBatch,
  useLimsStockBatchAudit,
  useRestoreLimsStockBatch,
  useBulkRestoreLimsStockBatch
} from "./LimsStockBatch.queries";
import LimsStockBatchForm, {
  type LimsStockBatchFormMode
} from "./LimsStockBatchForm";
import type {
  LimsStockBatch,
  LimsStockBatchPayload
} from "./LimsStockBatch.types";

/** LimsStockBatch list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsStockBatchList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();

  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsStockBatch, LimsStockBatchPayload>();
  const auditQuery = useLimsStockBatchAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsStockBatchList>[1],
      signal?: AbortSignal
    ) => fetchLimsStockBatchList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsStockBatch>({
    entity: "limsStockBatch",
    queryKey: [...limsStockBatchKeys.all, { includeRemoved }],
    fetchList
  });

  const bulkClone = useBulkCloneLimsStockBatch();
  const bulkCopy = useBulkCopyLimsStockBatch();
  const bulkDelete = useBulkDeleteLimsStockBatch();
  const bulkUpdate = useBulkUpdateLimsStockBatch();
  const restore = useRestoreLimsStockBatch();
  const bulkRestoreStockBatch = useBulkRestoreLimsStockBatch();

  const busy =
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending ||
    bulkRestoreStockBatch.isPending;

  const columnDefs = useMemo(
    () => getLimsStockBatchColumns({ t, includeRemoved }),
    [t, includeRemoved]
  );

  // One record opens on its own page; several are reviewed side by side in the modal.
  const page = (id: string) =>
    recordPageUrl(PageUrl.LIMSStockBatchesWorkspace.path, id);
  const openForm = useCallback(
    (mode: LimsStockBatchFormMode, row: LimsStockBatch | null) => {
      if (mode === "create" || !row) {
        navigate(page(NEW_RECORD));
        return;
      }
      navigate(mode === "view" ? `${page(row.id)}?mode=view` : page(row.id));
    },
    [navigate]
  );

  const openCopy = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        navigate(`${page(NEW_RECORD)}?copyFrom=${ids[0]}`);
        return;
      }
      setCopyIds(ids);
      openModal();
    },
    [openModal, navigate]
  );

  const openView = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        navigate(`${page(ids[0])}?mode=view`);
        return;
      }
      setViewIds(ids);
      openModal();
    },
    [openModal, navigate]
  );

  const openEdit = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        navigate(page(ids[0]));
        return;
      }
      setEditIds(ids);
      openModal();
    },
    [openModal, navigate]
  );

  const handleCloseForm = () => {
    closeModal();
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: LimsStockBatchPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (
    updates: { id: string; payload: LimsStockBatchPayload }[]
  ) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const label = (row: LimsStockBatch) =>
    String(row.stockBatchId ?? row.stockBatchId ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_STOCK_BATCH,
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
        permission: LIMS_PERMISSIONS.CREATE_STOCK_BATCH,
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
        permission: LIMS_PERMISSIONS.UPDATE_STOCK_BATCH,
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
        permission: LIMS_PERMISSIONS.UPDATE_STOCK_BATCH,
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
        permission: LIMS_PERMISSIONS.DELETE_STOCK_BATCH,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsStockBatch>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_STOCK_BATCH,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_STOCK_BATCH,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_STOCK_BATCH,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_STOCK_BATCH,
        onClick: (row) => openCopy([row.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_STOCK_BATCH,
        hidden: (row: LimsStockBatch) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_STOCK_BATCH,
        hidden: (row: LimsStockBatch) => Boolean(row.isRemoved),
        onClick: (row) =>
          compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [
            label(row)
          ])
      }
    ],
    [compliance, openCopy, openForm, t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-132px)] min-h-0">
      <DataTable<LimsStockBatch>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsStockBatches")}
        searchPlaceholder={t("search", { entity: t("limsStockBatches") })}
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
            label: t("create", { entity: t("limsStockBatch") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_STOCK_BATCH,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoStockBatches") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1100px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsStockBatch, LimsStockBatchPayload>
            ids={copyIds}
            fetchById={fetchLimsStockBatchById}
            FormComponent={LimsStockBatchForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsStockBatch")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsStockBatch>
            ids={viewIds}
            fetchById={fetchLimsStockBatchById}
            FormComponent={LimsStockBatchForm}
            onClose={handleCloseForm}
            entityLabel={t("limsStockBatch")}
          />
        ) : editIds ? (
          <EditStepper<LimsStockBatch, LimsStockBatchPayload>
            ids={editIds}
            fetchById={fetchLimsStockBatchById}
            FormComponent={LimsStockBatchForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsStockBatch")}
          />
        ) : null}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsStockBatch")}
        entityLabelPlural={t("limsStockBatches")}
        getRecordLabel={label}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        bulkRestoring={bulkRestoreStockBatch.isPending}
        bulkUpdating={bulkUpdate.isPending}
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onBulkUpdate={async (reason) => {
          const pending = compliance.pendingBulkUpdate;
          if (pending) {
            await bulkUpdate.mutateAsync({
              updates: pending.updates,
              changeReason: reason
            });
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
            await bulkRestoreStockBatch.mutateAsync({
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

export default LimsStockBatchList;
