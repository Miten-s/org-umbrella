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
import { fetchLimsAnalysisList } from "./LimsAnalysis.api";
import { getLimsAnalysisColumns } from "./LimsAnalysis.columns";
import {
  limsAnalysisKeys,
  useBulkCloneLimsAnalysis,
  useBulkDeleteLimsAnalysis,
  useCreateLimsAnalysis,
  useLimsAnalysisAudit,
  useRestoreLimsAnalysis,
  useUpdateLimsAnalysis
} from "./LimsAnalysis.queries";
import LimsAnalysisForm, { type LimsAnalysisFormMode } from "./LimsAnalysisForm";
import type { LimsAnalysis, LimsAnalysisPayload } from "./LimsAnalysis.types";

/** LimsAnalysis list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsAnalysisList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsAnalysis | null>(null);
  const [formMode, setFormMode] = useState<LimsAnalysisFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsAnalysis, LimsAnalysisPayload>();
  const auditQuery = useLimsAnalysisAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsAnalysisList>[1], signal?: AbortSignal) =>
      fetchLimsAnalysisList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsAnalysis>({
    entity: "limsAnalysis",
    queryKey: [...limsAnalysisKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsAnalysis();
  const update = useUpdateLimsAnalysis();
  const bulkClone = useBulkCloneLimsAnalysis();
  const bulkDelete = useBulkDeleteLimsAnalysis();
  const restore = useRestoreLimsAnalysis();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsAnalysisColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsAnalysisFormMode, row: LimsAnalysis | null) => {
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

  const handleSave = async (payload: LimsAnalysisPayload) => {
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

  const label = (row: LimsAnalysis) => String(row.analysisId ?? row.name ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
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
        permission: LIMS_PERMISSIONS.DELETE_ANALYSIS,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsAnalysis>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsAnalysis") }),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_ANALYSIS,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_ANALYSIS,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
        onClick: (row) => bulkClone.mutate({ mode: "ids", ids: [row.id] })
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
        hidden: (row: LimsAnalysis) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_ANALYSIS,
        hidden: (row: LimsAnalysis) => Boolean(row.isRemoved),
        onClick: (row) => compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [label(row)])
      }
    ],
    [bulkClone, compliance, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsAnalysis>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsAnalyses")}
        searchPlaceholder={t("search", { entity: t("limsAnalyses") })}
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
            label: t("create", { entity: t("limsAnalysis") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoAnalyses") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[1100px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsAnalysisForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={create.isPending || update.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsAnalysis")}
        entityLabelPlural={t("limsAnalyses")}
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

export default LimsAnalysisList;
