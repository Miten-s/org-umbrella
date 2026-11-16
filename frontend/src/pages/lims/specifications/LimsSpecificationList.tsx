import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  fetchLimsSpecificationById,
  fetchLimsSpecificationList
} from "./LimsSpecification.api";
import { getLimsSpecificationColumns } from "./LimsSpecification.columns";
import {
  limsSpecificationKeys,
  useBulkCloneLimsSpecification,
  useBulkCopyLimsSpecification,
  useBulkDeleteLimsSpecification,
  useBulkUpdateLimsSpecification,
  useLimsSpecificationAudit,
  useRestoreLimsSpecification,
  useBulkRestoreLimsSpecification
} from "./LimsSpecification.queries";
import LimsSpecificationForm, {
  type LimsSpecificationFormMode
} from "./LimsSpecificationForm";
import {
  NEW_SPECIFICATION,
  specificationWorkspaceUrl
} from "./specificationRoutes";
import type {
  LimsSpecification,
  LimsSpecificationPayload
} from "./LimsSpecification.types";

/** LimsSpecification list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsSpecificationList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();

  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<
    LimsSpecification,
    LimsSpecificationPayload
  >();
  const auditQuery = useLimsSpecificationAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsSpecificationList>[1],
      signal?: AbortSignal
    ) => fetchLimsSpecificationList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsSpecification>({
    entity: "limsSpecification",
    queryKey: [...limsSpecificationKeys.all, { includeRemoved }],
    fetchList
  });

  const bulkClone = useBulkCloneLimsSpecification();
  const bulkCopy = useBulkCopyLimsSpecification();
  const bulkDelete = useBulkDeleteLimsSpecification();
  const bulkUpdate = useBulkUpdateLimsSpecification();
  const restore = useRestoreLimsSpecification();
  const bulkRestoreSpecification = useBulkRestoreLimsSpecification();

  const busy =
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending ||
    bulkRestoreSpecification.isPending;

  const columnDefs = useMemo(
    () => getLimsSpecificationColumns({ t, includeRemoved }),
    [t, includeRemoved]
  );

  // One specification opens on its own page; several are reviewed side by side in the modal.
  const openForm = useCallback(
    (mode: LimsSpecificationFormMode, row: LimsSpecification | null) => {
      if (mode === "create" || !row) {
        navigate(specificationWorkspaceUrl(NEW_SPECIFICATION));
        return;
      }
      navigate(
        mode === "view"
          ? `${specificationWorkspaceUrl(row.id)}?mode=view`
          : specificationWorkspaceUrl(row.id)
      );
    },
    [navigate]
  );

  const openCopy = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        navigate(
          `${specificationWorkspaceUrl(NEW_SPECIFICATION)}?copyFrom=${ids[0]}`
        );
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
        navigate(`${specificationWorkspaceUrl(ids[0])}?mode=view`);
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
        navigate(specificationWorkspaceUrl(ids[0]));
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

  const handleSaveCopies = async (payloads: LimsSpecificationPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (
    updates: { id: string; payload: LimsSpecificationPayload }[]
  ) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const label = (row: LimsSpecification) =>
    String(row.specId ?? row.name ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_SPECIFICATION,
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
        permission: LIMS_PERMISSIONS.CREATE_SPECIFICATION,
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
        permission: LIMS_PERMISSIONS.UPDATE_SPECIFICATION,
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
        permission: LIMS_PERMISSIONS.UPDATE_SPECIFICATION,
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
              .map(label)
          );
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_SPECIFICATION,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map(label)
              : []
          )
      }
    ],
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsSpecification>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_SPECIFICATION,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_SPECIFICATION,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_SPECIFICATION,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_SPECIFICATION,
        onClick: (row) => openCopy([row.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_SPECIFICATION,
        hidden: (row: LimsSpecification) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_SPECIFICATION,
        hidden: (row: LimsSpecification) => Boolean(row.isRemoved),
        onClick: (row) =>
          compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [
            label(row)
          ])
      }
    ],
    [compliance, openCopy, openForm, t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-132px)] min-h-0">
      <DataTable<LimsSpecification>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsSpecifications")}
        searchPlaceholder={t("search", { entity: t("limsSpecifications") })}
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
            label: t("create", { entity: t("limsSpecification") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_SPECIFICATION,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoSpecifications") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1100px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsSpecification, LimsSpecificationPayload>
            ids={copyIds}
            fetchById={fetchLimsSpecificationById}
            FormComponent={LimsSpecificationForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsSpecification")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsSpecification>
            ids={viewIds}
            fetchById={fetchLimsSpecificationById}
            FormComponent={LimsSpecificationForm}
            onClose={handleCloseForm}
            entityLabel={t("limsSpecification")}
          />
        ) : editIds ? (
          <EditStepper<LimsSpecification, LimsSpecificationPayload>
            ids={editIds}
            fetchById={fetchLimsSpecificationById}
            FormComponent={LimsSpecificationForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsSpecification")}
          />
        ) : null}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsSpecification")}
        entityLabelPlural={t("limsSpecifications")}
        getRecordLabel={label}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        bulkRestoring={bulkRestoreSpecification.isPending}
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
            await restore.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
        onBulkRestore={async (reason) => {
          const pending = compliance.pendingBulkRestore;
          if (pending) {
            await bulkRestoreSpecification.mutateAsync({
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

export default LimsSpecificationList;
