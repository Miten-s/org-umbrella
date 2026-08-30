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
import { idsSelection } from "@/lib/query/listTypes";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsInstrumentById, fetchLimsInstrumentList } from "./LimsInstrument.api";
import { getLimsInstrumentColumns } from "./LimsInstrument.columns";
import {
  limsInstrumentKeys,
  useBulkCloneLimsInstrument,
  useBulkCopyLimsInstrument,
  useBulkDeleteLimsInstrument,
  useCreateLimsInstrument,
  useLimsInstrumentAudit,
  useRestoreLimsInstrument,
  useUpdateLimsInstrument,
  useLimsInstrumentById
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
  const { isOpen, openModal, closeModal } = useModal();

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsInstrumentFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsInstrument, LimsInstrumentPayload>();
  const auditQuery = useLimsInstrumentAudit(compliance.auditRow?.id);
  const detailQuery = useLimsInstrumentById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

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

  const create = useCreateLimsInstrument();
  const update = useUpdateLimsInstrument();
  const bulkClone = useBulkCloneLimsInstrument();
  const bulkCopy = useBulkCopyLimsInstrument();
  const bulkDelete = useBulkDeleteLimsInstrument();
  const restore = useRestoreLimsInstrument();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsInstrumentColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsInstrumentFormMode, row: LimsInstrument | null) => {
      setFormMode(mode);
      setActiveId(row?.id ?? null);
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

  const handleSaveCopies = async (payloads: LimsInstrumentPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsInstrumentPayload, files: File[]) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload, files);
      closeModal();
      return;
    }
    await create.mutateAsync({ payload, files });
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await update.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason },
      files: pending.files
    });
    compliance.clearUpdate();
    setActiveId(null);
    setFormMode("create");
  };

  const label = (row: LimsInstrument) =>
    String(row.instrumentId ?? row.name ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
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
    [bulkClone, compliance, openCopy, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsInstrument>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsInstrument") }),
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
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
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
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsInstrumentForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={create.isPending || update.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsInstrument")}
        entityLabelPlural={t("limsInstruments")}
        getRecordLabel={label}
        updating={update.isPending}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
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
            await restore.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsInstrumentList;
