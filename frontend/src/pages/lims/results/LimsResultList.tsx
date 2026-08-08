import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TimeIcon, TrashBinIcon } from "@/public/icons";
import { fetchLimsResultList } from "./LimsResult.api";
import { getLimsResultColumns } from "./LimsResult.columns";
import {
  limsResultKeys,
  useBulkCloneLimsResult,
  useBulkDeleteLimsResult,
  useCreateLimsResult,
  useLimsResultAudit,
  useRestoreLimsResult,
  useUpdateLimsResult
} from "./LimsResult.queries";
import LimsResultForm, { type LimsResultFormMode } from "./LimsResultForm";
import type { LimsResult, LimsResultPayload } from "./LimsResult.types";

/** LimsResult list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsResultList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsResult | null>(null);
  const [formMode, setFormMode] = useState<LimsResultFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsResult, LimsResultPayload>();
  const auditQuery = useLimsResultAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsResultList>[1], signal?: AbortSignal) =>
      fetchLimsResultList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsResult>({
    entity: "limsResult",
    queryKey: [...limsResultKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsResult();
  const update = useUpdateLimsResult();
  const bulkClone = useBulkCloneLimsResult();
  const bulkDelete = useBulkDeleteLimsResult();
  const restore = useRestoreLimsResult();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsResultColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsResultFormMode, row: LimsResult | null) => {
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

  const handleSave = async (payload: LimsResultPayload) => {
    if (active) {
      compliance.requestUpdate(active.id, payload);
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
    setActive(null);
    setFormMode("create");
  };

  const label = (row: LimsResult) => String(row.resultId ?? row.componentName ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_RESULT,
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
        permission: LIMS_PERMISSIONS.DELETE_RESULT,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsResult>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsResult") }),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_RESULT,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_RESULT,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_RESULT,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_RESULT,
        onClick: (row) => bulkClone.mutate({ mode: "ids", ids: [row.id] })
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_RESULT,
        hidden: (row: LimsResult) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_RESULT,
        hidden: (row: LimsResult) => Boolean(row.isRemoved),
        onClick: (row) => compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [label(row)])
      }
    ],
    [bulkClone, compliance, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsResult>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsResults")}
        searchPlaceholder={t("search", { entity: t("limsResults") })}
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
            label: t("create", { entity: t("limsResult") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_RESULT,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoResults") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[1100px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsResultForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={create.isPending || update.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsResult")}
        entityLabelPlural={t("limsResults")}
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

export default LimsResultList;
