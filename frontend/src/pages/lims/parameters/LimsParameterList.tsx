import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import CopyStepper from "@/components/data/CopyStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
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
  useCreateLimsParameter,
  useLimsParameterAudit,
  useRestoreLimsParameter,
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

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsParameterFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);

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
  const restoreParameter = useRestoreLimsParameter();

  const busy =
    createParameter.isPending ||
    updateParameter.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    restoreParameter.isPending;

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

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
    setCopyIds(null);
  };

  const handleSaveCopies = async (payloads: LimsParameterPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
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
        key: "clone",
        label: (count) => (count > 1 ? "Copy parameters" : "Copy parameter"),
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
        key: "delete",
        label: (count) =>
          count > 1 ? "Remove parameters" : "Remove parameter",
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
    [bulkClone, compliance, openCopy, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsParameter>[]>(
    () => [
      {
        key: "view",
        label: "View parameter",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_PARAMETER,
        onClick: (parameter) => openForm("view", parameter)
      },
      {
        key: "edit",
        label: "Edit parameter",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_PARAMETER,
        onClick: (parameter) => openForm("edit", parameter)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_PARAMETER,
        onClick: (parameter) => compliance.openAudit(parameter)
      },
      {
        key: "clone",
        label: "Copy parameter",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_PARAMETER,
        onClick: (parameter) =>
          openCopy([parameter.id])
      },
      {
        key: "restore",
        label: "Restore parameter",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_PARAMETER,
        hidden: (parameter: LimsParameter) => !parameter.isRemoved,
        onClick: (parameter) => compliance.requestRestore(parameter)
      },
      {
        key: "delete",
        label: "Remove parameter",
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
    [compliance, openCopy, openForm]
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
            onClose={handleCloseForm}
            saving={bulkCopy.isPending}
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
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onUpdate={confirmUpdate}
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
      />
    </div>
  );
};

export default LimsParameterList;
