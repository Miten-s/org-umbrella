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
import { fetchLimsPhraseById, fetchLimsPhraseList } from "./LimsPhrase.api";
import { getLimsPhraseColumns } from "./LimsPhrase.columns";
import {
  limsPhraseKeys,
  useBulkCloneLimsPhrase,
  useBulkCopyLimsPhrase,
  useBulkDeleteLimsPhrase,
  useBulkUpdateLimsPhrase,
  useCreateLimsPhrase,
  useLimsPhraseAudit,
  useRestoreLimsPhrase,
  useBulkRestoreLimsPhrase,
  useUpdateLimsPhrase,
  useLimsPhraseById
} from "./LimsPhrase.queries";
import LimsPhraseForm, { type LimsPhraseFormMode } from "./LimsPhraseForm";
import type { LimsPhrase, LimsPhrasePayload } from "./LimsPhrase.types";

/** LIMS Pick Lists (Phrases) — system pick lists are seeded by the backend and must not be
 * removed or cloned (hidden per row); their values can still be edited. */
const LimsPhraseList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsPhraseFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsPhrase, LimsPhrasePayload>();
  const auditQuery = useLimsPhraseAudit(compliance.auditRow?.id);
  const detailQuery = useLimsPhraseById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsPhraseList>[1], signal?: AbortSignal) =>
      fetchLimsPhraseList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsPhrase>({
    entity: "limsPhrase",
    queryKey: [...limsPhraseKeys.all, { includeRemoved }],
    fetchList
  });

  const createPhrase = useCreateLimsPhrase();
  const updatePhrase = useUpdateLimsPhrase();
  const bulkClone = useBulkCloneLimsPhrase();
  const bulkCopy = useBulkCopyLimsPhrase();
  const bulkDelete = useBulkDeleteLimsPhrase();
  const bulkUpdate = useBulkUpdateLimsPhrase();
  const restorePhrase = useRestoreLimsPhrase();
  const bulkRestorePhrase = useBulkRestoreLimsPhrase();

  const busy =
    createPhrase.isPending ||
    updatePhrase.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restorePhrase.isPending ||
    bulkRestorePhrase.isPending;

  const columnDefs = useMemo(() => getLimsPhraseColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsPhraseFormMode, phrase: LimsPhrase | null) => {
      setFormMode(mode);
      setActiveId(phrase?.id ?? null);
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

  const handleSaveCopies = async (payloads: LimsPhrasePayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (updates: { id: string; payload: LimsPhrasePayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsPhrasePayload) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload);
      closeModal();
      return;
    }
    await createPhrase.mutateAsync(payload);
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updatePhrase.mutateAsync({
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
        permission: LIMS_PERMISSIONS.VIEW_PHRASE,
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
        permission: LIMS_PERMISSIONS.CREATE_PHRASE,
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
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
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
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
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
        permission: LIMS_PERMISSIONS.DELETE_PHRASE,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsPhrase>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_PHRASE,
        onClick: (phrase) => openForm("view", phrase)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
        onClick: (phrase) => openForm("edit", phrase)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_PHRASE,
        onClick: (phrase) => compliance.openAudit(phrase)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_PHRASE,
        // A cloned system list would collide on its seeded code.
        hidden: (phrase: LimsPhrase) => Boolean(phrase.isSystem),
        onClick: (phrase) => openCopy([phrase.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
        hidden: (phrase: LimsPhrase) => !phrase.isRemoved,
        onClick: (phrase) => compliance.requestRestore(phrase)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_PHRASE,
        // System pick lists cannot be deleted (spec p.25).
        hidden: (phrase: LimsPhrase) =>
          Boolean(phrase.isSystem) || Boolean(phrase.isRemoved),
        onClick: (phrase) =>
          compliance.requestDelete({ mode: "ids", ids: [phrase.id] }, 1, [
            phrase.name
          ])
      }
    ],
    [compliance, openCopy, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsPhrase>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsPhrases")}
        searchPlaceholder="Search pick lists…"
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
            label: t("create", { entity: t("limsPhrase") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_PHRASE,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoPhrases") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsPhrase, LimsPhrasePayload>
            ids={copyIds}
            fetchById={fetchLimsPhraseById}
            FormComponent={LimsPhraseForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsPhrase")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsPhrase>
            ids={viewIds}
            fetchById={fetchLimsPhraseById}
            FormComponent={LimsPhraseForm}
            onClose={handleCloseForm}
            entityLabel={t("limsPhrase")}
          />
        ) : editIds ? (
          <EditStepper<LimsPhrase, LimsPhrasePayload>
            ids={editIds}
            fetchById={fetchLimsPhraseById}
            FormComponent={LimsPhraseForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsPhrase")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsPhraseForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createPhrase.isPending || updatePhrase.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="pick list"
        entityLabelPlural="pick lists"
        getRecordLabel={(row) => row.phrase || row.name}
        updating={updatePhrase.isPending}
        deleting={bulkDelete.isPending}
        restoring={restorePhrase.isPending}
        bulkRestoring={bulkRestorePhrase.isPending}
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
            await bulkRestorePhrase.mutateAsync({
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

export default LimsPhraseList;
