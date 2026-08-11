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
import { fetchLimsProjectList } from "./LimsProject.api";
import { getLimsProjectColumns } from "./LimsProject.columns";
import {
  limsProjectKeys,
  useBulkCloneLimsProject,
  useBulkDeleteLimsProject,
  useCreateLimsProject,
  useLimsProjectAudit,
  useRestoreLimsProject,
  useUpdateLimsProject
} from "./LimsProject.queries";
import LimsProjectForm, { type LimsProjectFormMode } from "./LimsProjectForm";
import type { LimsProject, LimsProjectPayload } from "./LimsProject.types";

/** LIMS Projects — Track A module. */
const LimsProjectList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsProject | null>(null);
  const [formMode, setFormMode] = useState<LimsProjectFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsProject, LimsProjectPayload>();
  const auditQuery = useLimsProjectAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsProjectList>[1], signal?: AbortSignal) =>
      fetchLimsProjectList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsProject>({
    entity: "limsProject",
    queryKey: [...limsProjectKeys.all, { includeRemoved }],
    fetchList
  });

  const createProject = useCreateLimsProject();
  const updateProject = useUpdateLimsProject();
  const bulkClone = useBulkCloneLimsProject();
  const bulkDelete = useBulkDeleteLimsProject();
  const restoreProject = useRestoreLimsProject();

  const busy =
    createProject.isPending ||
    updateProject.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restoreProject.isPending;

  const columnDefs = useMemo(() => getLimsProjectColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsProjectFormMode, project: LimsProject | null) => {
      setFormMode(mode);
      setActive(project);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsProjectPayload, files: File[]) => {
    if (active) {
      compliance.requestUpdate(active.id, payload, files);
      closeModal();
      return;
    }
    await createProject.mutateAsync({ payload, files });
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updateProject.mutateAsync({
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
        label: (count) => (count > 1 ? "Copy projects" : "Copy project"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_PROJECT,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Remove projects" : "Remove project"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_PROJECT,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsProject>[]>(
    () => [
      {
        key: "view",
        label: "View project",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_PROJECT,
        onClick: (project) => openForm("view", project)
      },
      {
        key: "edit",
        label: "Edit project",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_PROJECT,
        onClick: (project) => openForm("edit", project)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_PROJECT,
        onClick: (project) => compliance.openAudit(project)
      },
      {
        key: "clone",
        label: "Copy project",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_PROJECT,
        onClick: (project) => bulkClone.mutate({ mode: "ids", ids: [project.id] })
      },
      {
        key: "restore",
        label: "Restore project",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_PROJECT,
        hidden: (project: LimsProject) => !project.isRemoved,
        onClick: (project) => compliance.requestRestore(project)
      },
      {
        key: "delete",
        label: "Remove project",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_PROJECT,
        hidden: (project: LimsProject) => Boolean(project.isRemoved),
        onClick: (project) =>
          compliance.requestDelete({ mode: "ids", ids: [project.id] }, 1, [
            project.name
          ])
      }
    ],
    [bulkClone, compliance, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsProject>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsProjects")}
        searchPlaceholder="Search projects…"
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
            label: t("create", { entity: t("limsProject") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_PROJECT,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoProjects") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
      >
        <LimsProjectForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createProject.isPending || updateProject.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="project"
        entityLabelPlural="projects"
        getRecordLabel={(row) => row.projectId || row.name}
        updating={updateProject.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreProject.isPending}
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
            await restoreProject.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsProjectList;
