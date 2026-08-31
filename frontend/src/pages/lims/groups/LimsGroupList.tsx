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
import { fetchLimsGroupById, fetchLimsGroupList } from "./LimsGroup.api";
import { getLimsGroupColumns } from "./LimsGroup.columns";
import {
  limsGroupKeys,
  useBulkCloneLimsGroup,
  useBulkCopyLimsGroup,
  useBulkDeleteLimsGroup,
  useBulkUpdateLimsGroup,
  useCreateLimsGroup,
  useLimsGroupAudit,
  useRestoreLimsGroup,
  useUpdateLimsGroup,
  useLimsGroupById
} from "./LimsGroup.queries";
import LimsGroupForm, { type LimsGroupFormMode } from "./LimsGroupForm";
import type { LimsGroup, LimsGroupPayload } from "./LimsGroup.types";

/** LIMS Lab Groups — Track A module, same shape as Storage Locations. */
const LimsGroupList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsGroupFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsGroup, LimsGroupPayload>();
  const auditQuery = useLimsGroupAudit(compliance.auditRow?.id);
  const detailQuery = useLimsGroupById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

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
  const bulkCopy = useBulkCopyLimsGroup();
  const bulkDelete = useBulkDeleteLimsGroup();
  const bulkUpdate = useBulkUpdateLimsGroup();
  const restoreGroup = useRestoreLimsGroup();

  const busy =
    createGroup.isPending ||
    updateGroup.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restoreGroup.isPending;

  const columnDefs = useMemo(() => getLimsGroupColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsGroupFormMode, group: LimsGroup | null) => {
      setFormMode(mode);
      setActiveId(group?.id ?? null);
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

  const handleSaveCopies = async (payloads: LimsGroupPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (updates: { id: string; payload: LimsGroupPayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsGroupPayload) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload);
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
    setActiveId(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("view", { entity: t("limsGroups") }),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_GROUP,
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
        label: (count) => (count > 1 ? "Copy lab groups" : "Copy lab group"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_GROUP,
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
        permission: LIMS_PERMISSIONS.UPDATE_GROUP,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "delete",
        label: (count) =>
          count > 1 ? "Remove lab groups" : "Remove lab group",
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_GROUP,
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
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
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
        onClick: (group) => openCopy([group.id])
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
          compliance.requestDelete({ mode: "ids", ids: [group.id] }, 1, [
            group.name
          ])
      }
    ],
    [compliance, openCopy, openForm]
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
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsGroup, LimsGroupPayload>
            ids={copyIds}
            fetchById={fetchLimsGroupById}
            FormComponent={LimsGroupForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsGroup")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsGroup>
            ids={viewIds}
            fetchById={fetchLimsGroupById}
            FormComponent={LimsGroupForm}
            onClose={handleCloseForm}
            entityLabel={t("limsGroup")}
          />
        ) : editIds ? (
          <EditStepper<LimsGroup, LimsGroupPayload>
            ids={editIds}
            fetchById={fetchLimsGroupById}
            FormComponent={LimsGroupForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsGroup")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsGroupForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createGroup.isPending || updateGroup.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="lab group"
        entityLabelPlural="lab groups"
        getRecordLabel={(row) => row.groupId || row.name}
        updating={updateGroup.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreGroup.isPending}
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
            await restoreGroup.mutateAsync({
              id: pending.id,
              changeReason: reason
            });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsGroupList;
