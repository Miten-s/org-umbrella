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
import { fetchLimsCalibrationList } from "./LimsCalibration.api";
import { getLimsCalibrationColumns } from "./LimsCalibration.columns";
import {
  limsCalibrationKeys,
  useBulkCloneLimsCalibration,
  useBulkDeleteLimsCalibration,
  useCreateLimsCalibration,
  useLimsCalibrationAudit,
  useRestoreLimsCalibration,
  useUpdateLimsCalibration
} from "./LimsCalibration.queries";
import LimsCalibrationForm, { type LimsCalibrationFormMode } from "./LimsCalibrationForm";
import type { LimsCalibration, LimsCalibrationPayload } from "./LimsCalibration.types";

/** LimsCalibration list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsCalibrationList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsCalibration | null>(null);
  const [formMode, setFormMode] = useState<LimsCalibrationFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsCalibration, LimsCalibrationPayload>();
  const auditQuery = useLimsCalibrationAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsCalibrationList>[1], signal?: AbortSignal) =>
      fetchLimsCalibrationList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsCalibration>({
    entity: "limsCalibration",
    queryKey: [...limsCalibrationKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsCalibration();
  const update = useUpdateLimsCalibration();
  const bulkClone = useBulkCloneLimsCalibration();
  const bulkDelete = useBulkDeleteLimsCalibration();
  const restore = useRestoreLimsCalibration();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsCalibrationColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsCalibrationFormMode, row: LimsCalibration | null) => {
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

  const handleSave = async (payload: LimsCalibrationPayload) => {
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

  const label = (row: LimsCalibration) => String(row.calibrationId ?? row.calibrationName ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_CALIBRATION,
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
        permission: LIMS_PERMISSIONS.DELETE_CALIBRATION,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsCalibration>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsCalibration") }),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_CALIBRATION,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_CALIBRATION,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_CALIBRATION,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_CALIBRATION,
        onClick: (row) => bulkClone.mutate({ mode: "ids", ids: [row.id] })
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_CALIBRATION,
        hidden: (row: LimsCalibration) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_CALIBRATION,
        hidden: (row: LimsCalibration) => Boolean(row.isRemoved),
        onClick: (row) => compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [label(row)])
      }
    ],
    [bulkClone, compliance, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsCalibration>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsCalibrations")}
        searchPlaceholder={t("search", { entity: t("limsCalibrations") })}
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
            label: t("create", { entity: t("limsCalibration") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_CALIBRATION,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoCalibrations") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[1100px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsCalibrationForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={create.isPending || update.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsCalibration")}
        entityLabelPlural={t("limsCalibrations")}
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

export default LimsCalibrationList;
