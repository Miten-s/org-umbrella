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
import { fetchLimsStudyList } from "./LimsStudy.api";
import { getLimsStudyColumns } from "./LimsStudy.columns";
import {
  limsStudyKeys,
  useBulkCloneLimsStudy,
  useBulkDeleteLimsStudy,
  useCreateLimsStudy,
  useLimsStudyAudit,
  useRestoreLimsStudy,
  useUpdateLimsStudy
} from "./LimsStudy.queries";
import LimsStudyForm, { type LimsStudyFormMode } from "./LimsStudyForm";
import type { LimsStudy, LimsStudyPayload } from "./LimsStudy.types";

/** LIMS Studys — Track A module. */
const LimsStudyList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsStudy | null>(null);
  const [formMode, setFormMode] = useState<LimsStudyFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsStudy, LimsStudyPayload>();
  const auditQuery = useLimsStudyAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsStudyList>[1], signal?: AbortSignal) =>
      fetchLimsStudyList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsStudy>({
    entity: "limsStudy",
    queryKey: [...limsStudyKeys.all, { includeRemoved }],
    fetchList
  });

  const createStudy = useCreateLimsStudy();
  const updateStudy = useUpdateLimsStudy();
  const bulkClone = useBulkCloneLimsStudy();
  const bulkDelete = useBulkDeleteLimsStudy();
  const restoreStudy = useRestoreLimsStudy();

  const busy =
    createStudy.isPending ||
    updateStudy.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restoreStudy.isPending;

  const columnDefs = useMemo(() => getLimsStudyColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsStudyFormMode, study: LimsStudy | null) => {
      setFormMode(mode);
      setActive(study);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsStudyPayload, files: File[]) => {
    if (active) {
      compliance.requestUpdate(active.id, payload, files);
      closeModal();
      return;
    }
    await createStudy.mutateAsync({ payload, files });
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updateStudy.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason },
      files: pending.files
    });
    compliance.clearUpdate();
    setActive(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy studys" : "Copy study"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_STUDY,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Remove studys" : "Remove study"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_STUDY,
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
    [bulkClone, compliance, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsStudy>[]>(
    () => [
      {
        key: "view",
        label: "View study",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_STUDY,
        onClick: (study) => openForm("view", study)
      },
      {
        key: "edit",
        label: "Edit study",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_STUDY,
        onClick: (study) => openForm("edit", study)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_STUDY,
        onClick: (study) => compliance.openAudit(study)
      },
      {
        key: "clone",
        label: "Copy study",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_STUDY,
        onClick: (study) => bulkClone.mutate({ mode: "ids", ids: [study.id] })
      },
      {
        key: "restore",
        label: "Restore study",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_STUDY,
        hidden: (study: LimsStudy) => !study.isRemoved,
        onClick: (study) => compliance.requestRestore(study)
      },
      {
        key: "delete",
        label: "Remove study",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_STUDY,
        hidden: (study: LimsStudy) => Boolean(study.isRemoved),
        onClick: (study) =>
          compliance.requestDelete({ mode: "ids", ids: [study.id] }, 1, [
            study.name
          ])
      }
    ],
    [bulkClone, compliance, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsStudy>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsStudies")}
        searchPlaceholder="Search studys…"
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
            label: t("create", { entity: t("limsStudy") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_STUDY,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoStudies") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
      >
        <LimsStudyForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createStudy.isPending || updateStudy.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="study"
        entityLabelPlural="studies"
        getRecordLabel={(row) => row.studyId || row.name}
        updating={updateStudy.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreStudy.isPending}
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
            await restoreStudy.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsStudyList;
