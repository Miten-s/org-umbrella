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
import { fetchLimsInstrumentList } from "./LimsInstrument.api";
import { getLimsInstrumentColumns } from "./LimsInstrument.columns";
import {
  limsInstrumentKeys,
  useBulkCloneLimsInstrument,
  useBulkDeleteLimsInstrument,
  useCreateLimsInstrument,
  useLimsInstrumentAudit,
  useRestoreLimsInstrument,
  useUpdateLimsInstrument
} from "./LimsInstrument.queries";
import LimsInstrumentForm, { type LimsInstrumentFormMode } from "./LimsInstrumentForm";
import type { LimsInstrument, LimsInstrumentPayload } from "./LimsInstrument.types";

/** LimsInstrument list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsInstrumentList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsInstrument | null>(null);
  const [formMode, setFormMode] = useState<LimsInstrumentFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsInstrument, LimsInstrumentPayload>();
  const auditQuery = useLimsInstrumentAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsInstrumentList>[1], signal?: AbortSignal) =>
      fetchLimsInstrumentList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsInstrument>({
    entity: "limsInstrument",
    queryKey: [...limsInstrumentKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsInstrument();
  const update = useUpdateLimsInstrument();
  const bulkClone = useBulkCloneLimsInstrument();
  const bulkDelete = useBulkDeleteLimsInstrument();
  const restore = useRestoreLimsInstrument();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsInstrumentColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsInstrumentFormMode, row: LimsInstrument | null) => {
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

  const handleSave = async (payload: LimsInstrumentPayload, files: File[]) => {
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

  const label = (row: LimsInstrument) => String(row.instrumentId ?? row.name ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_INSTRUMENT,
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
        permission: LIMS_PERMISSIONS.DELETE_INSTRUMENT,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsInstrument>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsInstrument") }),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_INSTRUMENT,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_INSTRUMENT,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_INSTRUMENT,
        onClick: (row) => bulkClone.mutate({ mode: "ids", ids: [row.id] })
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT,
        hidden: (row: LimsInstrument) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_INSTRUMENT,
        hidden: (row: LimsInstrument) => Boolean(row.isRemoved),
        onClick: (row) => compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [label(row)])
      }
    ],
    [bulkClone, compliance, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsInstrument>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsInstruments")}
        searchPlaceholder={t("search", { entity: t("limsInstruments") })}
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
            label: t("create", { entity: t("limsInstrument") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_INSTRUMENT,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoInstruments") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[1100px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsInstrumentForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={create.isPending || update.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsInstrument")}
        entityLabelPlural={t("limsInstruments")}
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

export default LimsInstrumentList;
