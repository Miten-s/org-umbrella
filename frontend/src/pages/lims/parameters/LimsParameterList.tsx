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
import { fetchLimsParameterById, fetchLimsParameterList } from "./LimsParameter.api";
import { getLimsParameterColumns } from "./LimsParameter.columns";
import {
  limsParameterKeys,
  useBulkCloneLimsParameter,
  useBulkCopyLimsParameter,
  useBulkDeleteLimsParameter,
  useBulkUpdateLimsParameter,
  useCreateLimsParameter,
  useLimsParameterAudit,
  useRestoreLimsParameter,
  useBulkRestoreLimsParameter,
  useUpdateLimsParameter,
  useLimsParameterById
} from "./LimsParameter.queries";
import LimsParameterForm, {
  type LimsParameterFormMode
} from "./LimsParameterForm";
import type {
  LimsParameter,
  LimsParameterPayload
} from "./LimsParameter.types";

/** LIMS Parameters — Track A module. */
const LimsParameterList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsParameterFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsParameter, LimsParameterPayload>();
  const auditQuery = useLimsParameterAudit(compliance.auditRow?.id);
  const detailQuery = useLimsParameterById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsParameterList>[1],
      signal?: AbortSignal
    ) => fetchLimsParameterList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsParameter>({
    entity: "limsParameter",
    queryKey: [...limsParameterKeys.all, { includeRemoved }],
    fetchList
  });

  const createParameter = useCreateLimsParameter();
  const updateParameter = useUpdateLimsParameter();
  const bulkClone = useBulkCloneLimsParameter();
  const bulkCopy = useBulkCopyLimsParameter();
  const bulkDelete = useBulkDeleteLimsParameter();
  const bulkUpdate = useBulkUpdateLimsParameter();
  const restoreParameter = useRestoreLimsParameter();
  const bulkRestoreParameter = useBulkRestoreLimsParameter();

  const busy =
    createParameter.isPending ||
    updateParameter.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restoreParameter.isPending ||
    bulkRestoreParameter.isPending;

  const columnDefs = useMemo(() => getLimsParameterColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsParameterFormMode, parameter: LimsParameter | null) => {
      setFormMode(mode);
      setActiveId(parameter?.id ?? null);
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

  const handleSaveCopies = async (payloads: LimsParameterPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (updates: { id: string; payload: LimsParameterPayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsParameterPayload) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload);
      closeModal();
      return;
    }
    await createParameter.mutateAsync(payload);
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updateParameter.mutateAsync({
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
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_PARAMETER,
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
        permission: LIMS_PERMISSIONS.CREATE_PARAMETER,
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
        permission: LIMS_PERMISSIONS.UPDATE_PARAMETER,
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
        permission: LIMS_PERMISSIONS.UPDATE_PARAMETER,
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
              .map((row) => row.parameterName)
          );
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_PARAMETER,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map((row) => row.parameterName)
              : []
          )
      }
    ],
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsParameter>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_PARAMETER,
        onClick: (parameter) => openForm("view", parameter)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_PARAMETER,
        onClick: (parameter) => openForm("edit", parameter)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_PARAMETER,
        onClick: (parameter) => compliance.openAudit(parameter)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_PARAMETER,
        onClick: (parameter) =>
          openCopy([parameter.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_PARAMETER,
        hidden: (parameter: LimsParameter) => !parameter.isRemoved,
        onClick: (parameter) => compliance.requestRestore(parameter)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_PARAMETER,
        hidden: (parameter: LimsParameter) => Boolean(parameter.isRemoved),
        onClick: (parameter) =>
          compliance.requestDelete({ mode: "ids", ids: [parameter.id] }, 1, [
            parameter.parameterName
          ])
      }
    ],
    [compliance, openCopy, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsParameter>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsParameters")}
        searchPlaceholder="Search parameters…"
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
            label: t("create", { entity: t("limsParameter") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_PARAMETER,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoParameters") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsParameter, LimsParameterPayload>
            ids={copyIds}
            fetchById={fetchLimsParameterById}
            FormComponent={LimsParameterForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsParameter")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsParameter>
            ids={viewIds}
            fetchById={fetchLimsParameterById}
            FormComponent={LimsParameterForm}
            onClose={handleCloseForm}
            entityLabel={t("limsParameter")}
          />
        ) : editIds ? (
          <EditStepper<LimsParameter, LimsParameterPayload>
            ids={editIds}
            fetchById={fetchLimsParameterById}
            FormComponent={LimsParameterForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsParameter")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsParameterForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createParameter.isPending || updateParameter.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="parameter"
        entityLabelPlural="parameters"
        getRecordLabel={(row) => row.parameterId || row.parameterName}
        updating={updateParameter.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreParameter.isPending}
        bulkRestoring={bulkRestoreParameter.isPending}
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
            await restoreParameter.mutateAsync({
              id: pending.id,
              changeReason: reason
            });
          }
          compliance.clearRestore();
        }}
        onBulkRestore={async (reason) => {
          const pending = compliance.pendingBulkRestore;
          if (pending) {
            await bulkRestoreParameter.mutateAsync({
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

export default LimsParameterList;
