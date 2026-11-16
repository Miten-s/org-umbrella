import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageUrl } from "@/types/utils.types";
import { NEW_RECORD, recordPageUrl } from "@/components/data/recordPage";
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
  fetchLimsTestGroupById,
  fetchLimsTestGroupList
} from "./LimsTestGroup.api";
import { getLimsTestGroupColumns } from "./LimsTestGroup.columns";
import {
  limsTestGroupKeys,
  useBulkCloneLimsTestGroup,
  useBulkCopyLimsTestGroup,
  useBulkDeleteLimsTestGroup,
  useBulkUpdateLimsTestGroup,
  useLimsTestGroupAudit,
  useRestoreLimsTestGroup,
  useBulkRestoreLimsTestGroup
} from "./LimsTestGroup.queries";
import LimsTestGroupForm, {
  type LimsTestGroupFormMode
} from "./LimsTestGroupForm";
import type {
  LimsTestGroup,
  LimsTestGroupPayload
} from "./LimsTestGroup.types";

/** LIMS Test Groups — system test groups are seeded by the backend and must not be removed
 * or cloned (hidden per row); their values can still be edited. */
const LimsTestGroupList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();

  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsTestGroup, LimsTestGroupPayload>();
  const auditQuery = useLimsTestGroupAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsTestGroupList>[1],
      signal?: AbortSignal
    ) => fetchLimsTestGroupList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsTestGroup>({
    entity: "limsTestGroup",
    queryKey: [...limsTestGroupKeys.all, { includeRemoved }],
    fetchList
  });

  const bulkClone = useBulkCloneLimsTestGroup();
  const bulkCopy = useBulkCopyLimsTestGroup();
  const bulkDelete = useBulkDeleteLimsTestGroup();
  const bulkUpdate = useBulkUpdateLimsTestGroup();
  const restorePhrase = useRestoreLimsTestGroup();
  const bulkRestoreTestGroup = useBulkRestoreLimsTestGroup();

  const busy =
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restorePhrase.isPending ||
    bulkRestoreTestGroup.isPending;

  const columnDefs = useMemo(
    () => getLimsTestGroupColumns({ t, includeRemoved }),
    [t, includeRemoved]
  );

  // One record opens on its own page; several are reviewed side by side in the modal.
  const page = (id: string) =>
    recordPageUrl(PageUrl.LIMSTestGroupsWorkspace.path, id);
  const openForm = useCallback(
    (mode: LimsTestGroupFormMode, row: LimsTestGroup | null) => {
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

  const handleSaveCopies = async (payloads: LimsTestGroupPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (
    updates: { id: string; payload: LimsTestGroupPayload }[]
  ) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_TEST_GROUP,
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
        permission: LIMS_PERMISSIONS.CREATE_TEST_GROUP,
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
        permission: LIMS_PERMISSIONS.UPDATE_TEST_GROUP,
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
        permission: LIMS_PERMISSIONS.UPDATE_TEST_GROUP,
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
              .map((row) => row.name)
          );
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_TEST_GROUP,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsTestGroup>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_TEST_GROUP,
        onClick: (phrase) => openForm("view", phrase)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_TEST_GROUP,
        onClick: (phrase) => openForm("edit", phrase)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_TEST_GROUP,
        onClick: (phrase) => compliance.openAudit(phrase)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_TEST_GROUP,
        onClick: (phrase) => openCopy([phrase.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_TEST_GROUP,
        hidden: (phrase: LimsTestGroup) => !phrase.isRemoved,
        onClick: (phrase) => compliance.requestRestore(phrase)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_TEST_GROUP,
        hidden: (phrase: LimsTestGroup) => Boolean(phrase.isRemoved),
        onClick: (phrase) =>
          compliance.requestDelete({ mode: "ids", ids: [phrase.id] }, 1, [
            phrase.name
          ])
      }
    ],
    [compliance, openCopy, openForm, t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-132px)] min-h-0">
      <DataTable<LimsTestGroup>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsTestGroups")}
        searchPlaceholder="Search test groups…"
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
            label: t("create", { entity: t("limsTestGroup") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_TEST_GROUP,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoTestGroups") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsTestGroup, LimsTestGroupPayload>
            ids={copyIds}
            fetchById={fetchLimsTestGroupById}
            FormComponent={LimsTestGroupForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsTestGroup")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsTestGroup>
            ids={viewIds}
            fetchById={fetchLimsTestGroupById}
            FormComponent={LimsTestGroupForm}
            onClose={handleCloseForm}
            entityLabel={t("limsTestGroup")}
          />
        ) : editIds ? (
          <EditStepper<LimsTestGroup, LimsTestGroupPayload>
            ids={editIds}
            fetchById={fetchLimsTestGroupById}
            FormComponent={LimsTestGroupForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsTestGroup")}
          />
        ) : null}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="test group"
        entityLabelPlural="test groups"
        getRecordLabel={(row) => row.testGroupId || row.name}
        deleting={bulkDelete.isPending}
        restoring={restorePhrase.isPending}
        bulkRestoring={bulkRestoreTestGroup.isPending}
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
            await restorePhrase.mutateAsync({
              id: pending.id,
              changeReason: reason
            });
          }
          compliance.clearRestore();
        }}
        onBulkRestore={async (reason) => {
          const pending = compliance.pendingBulkRestore;
          if (pending) {
            await bulkRestoreTestGroup.mutateAsync({
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

export default LimsTestGroupList;
