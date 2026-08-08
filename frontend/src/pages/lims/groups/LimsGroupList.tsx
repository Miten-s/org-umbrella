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
import { fetchLimsGroupList } from "./LimsGroup.api";
import { getLimsGroupColumns } from "./LimsGroup.columns";
import {
  limsGroupKeys,
  useBulkCloneLimsGroup,
  useBulkDeleteLimsGroup,
  useCreateLimsGroup,
  useLimsGroupAudit,
  useRestoreLimsGroup,
  useUpdateLimsGroup
} from "./LimsGroup.queries";
import LimsGroupForm, { type LimsGroupFormMode } from "./LimsGroupForm";
import type { LimsGroup, LimsGroupPayload } from "./LimsGroup.types";

/** LIMS Lab Groups — Track A module, same shape as Storage Locations. */
const LimsGroupList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsGroup | null>(null);
  const [formMode, setFormMode] = useState<LimsGroupFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsGroup, LimsGroupPayload>();
  const auditQuery = useLimsGroupAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsGroupList>[1], signal?: AbortSignal) =>
      fetchLimsGroupList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsGroup>({
    entity: "limsGroup",
    queryKey: [...limsGroupKeys.all, { includeRemoved }],
    fetchList
  });

  const createGroup = useCreateLimsGroup();
  const updateGroup = useUpdateLimsGroup();
  const bulkClone = useBulkCloneLimsGroup();
  const bulkDelete = useBulkDeleteLimsGroup();
  const restoreGroup = useRestoreLimsGroup();

  const busy =
    createGroup.isPending ||
    updateGroup.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restoreGroup.isPending;

  const columnDefs = useMemo(() => getLimsGroupColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsGroupFormMode, group: LimsGroup | null) => {
      setFormMode(mode);
      setActive(group);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsGroupPayload) => {
    if (active) {
      compliance.requestUpdate(active.id, payload);
      closeModal();
      return;
    }
    await createGroup.mutateAsync(payload);
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updateGroup.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason }
    });
    compliance.clearUpdate();
    setActive(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy lab groups" : "Copy lab group"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_GROUP,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Remove lab groups" : "Remove lab group"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_GROUP,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows.filter((row) => selection.ids.includes(row.id)).map((row) => row.name)
              : []
          )
      }
    ],
    [bulkClone, compliance, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsGroup>[]>(
    () => [
      {
        key: "view",
        label: "View lab group",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_GROUP,
        onClick: (group) => openForm("view", group)
      },
      {
        key: "edit",
        label: "Edit lab group",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_GROUP,
        onClick: (group) => openForm("edit", group)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_GROUP,
        onClick: (group) => compliance.openAudit(group)
      },
      {
        key: "clone",
        label: "Copy lab group",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_GROUP,
        onClick: (group) => bulkClone.mutate({ mode: "ids", ids: [group.id] })
      },
      {
        key: "restore",
        label: "Restore lab group",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_GROUP,
        hidden: (group: LimsGroup) => !group.isRemoved,
        onClick: (group) => compliance.requestRestore(group)
      },
      {
        key: "delete",
        label: "Remove lab group",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_GROUP,
        hidden: (group: LimsGroup) => Boolean(group.isRemoved),
        onClick: (group) =>
          compliance.requestDelete({ mode: "ids", ids: [group.id] }, 1, [group.name])
      }
    ],
    [bulkClone, compliance, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsGroup>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsGroups")}
        searchPlaceholder="Search lab groups…"
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
            label: t("create", { entity: t("limsGroup") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_GROUP,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoGroups") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsGroupForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createGroup.isPending || updateGroup.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="lab group"
        entityLabelPlural="lab groups"
        getRecordLabel={(row) => row.groupId || row.name}
        updating={updateGroup.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreGroup.isPending}
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
            await restoreGroup.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsGroupList;
