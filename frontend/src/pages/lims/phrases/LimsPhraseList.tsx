import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
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
import { fetchLimsPhraseList } from "./LimsPhrase.api";
import { getLimsPhraseColumns } from "./LimsPhrase.columns";
import {
  limsPhraseKeys,
  useBulkCloneLimsPhrase,
  useBulkDeleteLimsPhrase,
  useCreateLimsPhrase,
  useLimsPhraseAudit,
  useRestoreLimsPhrase,
  useUpdateLimsPhrase,
  useLimsPhraseById
} from "./LimsPhrase.queries";
import LimsPhraseForm, { type LimsPhraseFormMode } from "./LimsPhraseForm";
import type { LimsPhrase, LimsPhrasePayload } from "./LimsPhrase.types";

/**
 * LIMS Pick Lists (Phrases) — Track A module.
 *
 * System pick lists are seeded by the backend and must not be removed or
 * cloned; their values can still be edited. Those actions are hidden per row.
 */
const LimsPhraseList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsPhraseFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

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
  const bulkDelete = useBulkDeleteLimsPhrase();
  const restorePhrase = useRestoreLimsPhrase();

  const busy =
    createPhrase.isPending ||
    updatePhrase.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restorePhrase.isPending;

  const columnDefs = useMemo(() => getLimsPhraseColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsPhraseFormMode, phrase: LimsPhrase | null) => {
      setFormMode(mode);
      setActiveId(phrase?.id ?? null);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
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
        key: "clone",
        label: (count) => (count > 1 ? "Copy pick lists" : "Copy pick list"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_PHRASE,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) =>
          count > 1 ? "Remove pick lists" : "Remove pick list",
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
    [bulkClone, compliance, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsPhrase>[]>(
    () => [
      {
        key: "view",
        label: "View pick list",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_PHRASE,
        onClick: (phrase) => openForm("view", phrase)
      },
      {
        key: "edit",
        label: "Edit pick list",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
        onClick: (phrase) => openForm("edit", phrase)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_PHRASE,
        onClick: (phrase) => compliance.openAudit(phrase)
      },
      {
        key: "clone",
        label: "Copy pick list",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_PHRASE,
        // A cloned system list would collide on its seeded code.
        hidden: (phrase: LimsPhrase) => Boolean(phrase.isSystem),
        onClick: (phrase) => bulkClone.mutate({ mode: "ids", ids: [phrase.id] })
      },
      {
        key: "restore",
        label: "Restore pick list",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
        hidden: (phrase: LimsPhrase) => !phrase.isRemoved,
        onClick: (phrase) => compliance.requestRestore(phrase)
      },
      {
        key: "delete",
        label: "Remove pick list",
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
    [bulkClone, compliance, openForm]
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
      >
        {formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
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
            await restorePhrase.mutateAsync({
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

export default LimsPhraseList;
