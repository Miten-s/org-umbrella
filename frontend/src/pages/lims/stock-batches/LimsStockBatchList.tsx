import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import LimsShowRemovedSwitch from "@/components/lims/LimsShowRemovedSwitch";
import { LIMS_SUPPORTS_SEARCH } from "@/utils/lims.backend.shim";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TimeIcon, TrashBinIcon } from "@/public/icons";
import { fetchLimsStockBatchList } from "./LimsStockBatch.api";
import { getLimsStockBatchColumns } from "./LimsStockBatch.columns";
import {
  limsStockBatchKeys,
  useBulkCloneLimsStockBatch,
  useBulkDeleteLimsStockBatch,
  useCreateLimsStockBatch,
  useLimsStockBatchAudit,
  useRestoreLimsStockBatch,
  useUpdateLimsStockBatch
} from "./LimsStockBatch.queries";
import LimsStockBatchForm, { type LimsStockBatchFormMode } from "./LimsStockBatchForm";
import type { LimsStockBatch, LimsStockBatchPayload } from "./LimsStockBatch.types";

/** LimsStockBatch list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsStockBatchList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsStockBatch | null>(null);
  const [formMode, setFormMode] = useState<LimsStockBatchFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsStockBatch, LimsStockBatchPayload>();
  const auditQuery = useLimsStockBatchAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsStockBatchList>[1], signal?: AbortSignal) =>
      fetchLimsStockBatchList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsStockBatch>({
    entity: "limsStockBatch",
    queryKey: [...limsStockBatchKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsStockBatch();
  const update = useUpdateLimsStockBatch();
  const bulkClone = useBulkCloneLimsStockBatch();
  const bulkDelete = useBulkDeleteLimsStockBatch();
  const restore = useRestoreLimsStockBatch();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsStockBatchColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsStockBatchFormMode, row: LimsStockBatch | null) => {
      setFormMode(mode);
      setActive(row);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsStockBatchPayload, files: File[]) => {
    if (active) {
      compliance.requestUpdate(active.id, payload, files);
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
      payload: { ...pending.payload, changeReason: reason }, files: pending.files
    });
    compliance.clearUpdate();
    setActive(null);
    setFormMode("create");
  };

  const label = (row: LimsStockBatch) => String(row.stockBatchId ?? row.stockBatchId ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_STOCK_BATCH,
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
        permission: LIMS_PERMISSIONS.DELETE_STOCK_BATCH,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows.filter((row) => selection.ids.includes(row.id)).map(label)
              : []
          )
      }
    ],
    [bulkClone, compliance, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsStockBatch>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsStockBatch") }),
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
        onClick: (row) => bulkClone.mutate({ mode: "ids", ids: [row.id] })
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
        onClick: (row) => compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [label(row)])
      }
    ],
    [bulkClone, compliance, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsStockBatch>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsStockBatches")}
        searchable={LIMS_SUPPORTS_SEARCH}
        searchPlaceholder={t("search", { entity: t("limsStockBatches") })}
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        titleExtra={
          <LimsShowRemovedSwitch checked={includeRemoved} onChange={setIncludeRemoved} />
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
        className="m-4 max-h-[90vh] max-w-[1100px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsStockBatchForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={create.isPending || update.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsStockBatch")}
        entityLabelPlural={t("limsStockBatches")}
        getRecordLabel={label}
        updating={update.isPending}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        auditEntries={auditQuery.data ?? []}
        auditLoading={auditQuery.isLoading}
        onUpdate={confirmUpdate}
        onDelete={async (reason) => {
          const pending = compliance.pendingDelete;
          if (pending) {
            await bulkDelete.mutateAsync({ selection: pending.selection, changeReason: reason });
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

export default LimsStockBatchList;
