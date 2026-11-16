import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NEW_RECORD, recordPageUrl } from "@/components/data/recordPage";
import { PageUrl } from "@/types/utils.types";

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
  fetchLimsInstrumentById,
  fetchLimsInstrumentList
} from "./LimsInstrument.api";
import { getLimsInstrumentColumns } from "./LimsInstrument.columns";
import {
  limsInstrumentKeys,
  useBulkCloneLimsInstrument,
  useBulkCopyLimsInstrument,
  useBulkDeleteLimsInstrument,
  useBulkUpdateLimsInstrument,
  useLimsInstrumentAudit,
  useRestoreLimsInstrument,
  useBulkRestoreLimsInstrument
} from "./LimsInstrument.queries";
import LimsInstrumentForm, {
  type LimsInstrumentFormMode
} from "./LimsInstrumentForm";
import type {
  LimsInstrument,
  LimsInstrumentPayload
} from "./LimsInstrument.types";

/** LimsInstrument list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsInstrumentList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();

  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsInstrument, LimsInstrumentPayload>();
  const auditQuery = useLimsInstrumentAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsInstrumentList>[1],
      signal?: AbortSignal
    ) => fetchLimsInstrumentList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsInstrument>({
    entity: "limsInstrument",
    queryKey: [...limsInstrumentKeys.all, { includeRemoved }],
    fetchList
  });

  const bulkClone = useBulkCloneLimsInstrument();
  const bulkCopy = useBulkCopyLimsInstrument();
  const bulkDelete = useBulkDeleteLimsInstrument();
  const bulkUpdate = useBulkUpdateLimsInstrument();
  const restore = useRestoreLimsInstrument();
  const bulkRestoreInstrument = useBulkRestoreLimsInstrument();

  const busy =
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending ||
    bulkRestoreInstrument.isPending;

  const columnDefs = useMemo(
    () => getLimsInstrumentColumns({ t, includeRemoved }),
    [t, includeRemoved]
  );

  // One record opens on its own page; several are reviewed side by side in the modal.
  const page = (id: string) =>
    recordPageUrl(PageUrl.LIMSInstrumentsWorkspace.path, id);
  const openForm = useCallback(
    (mode: LimsInstrumentFormMode, row: LimsInstrument | null) => {
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

  const handleSaveCopies = async (payloads: LimsInstrumentPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (
    updates: { id: string; payload: LimsInstrumentPayload }[]
  ) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const label = (row: LimsInstrument) =>
    String(row.instrumentId ?? row.name ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_INSTRUMENT,
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
        permission: LIMS_PERMISSIONS.CREATE_INSTRUMENT,
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
        permission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT,
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
        permission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT,
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
        permission: LIMS_PERMISSIONS.DELETE_INSTRUMENT,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsInstrument>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
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
        onClick: (row) => openCopy([row.id])
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
        className="m-4 max-w-[1100px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsInstrument, LimsInstrumentPayload>
            ids={copyIds}
            fetchById={fetchLimsInstrumentById}
            FormComponent={LimsInstrumentForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsInstrument")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsInstrument>
            ids={viewIds}
            fetchById={fetchLimsInstrumentById}
            FormComponent={LimsInstrumentForm}
            onClose={handleCloseForm}
            entityLabel={t("limsInstrument")}
          />
        ) : editIds ? (
          <EditStepper<LimsInstrument, LimsInstrumentPayload>
            ids={editIds}
            fetchById={fetchLimsInstrumentById}
            FormComponent={LimsInstrumentForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsInstrument")}
          />
        ) : null}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsInstrument")}
        entityLabelPlural={t("limsInstruments")}
        getRecordLabel={label}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        bulkRestoring={bulkRestoreInstrument.isPending}
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
            await bulkRestoreInstrument.mutateAsync({
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

export default LimsInstrumentList;
