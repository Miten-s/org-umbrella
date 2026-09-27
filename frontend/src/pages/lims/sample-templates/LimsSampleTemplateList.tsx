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
import {
  fetchLimsSampleTemplateById,
  fetchLimsSampleTemplateList
} from "./LimsSampleTemplate.api";
import { getLimsSampleTemplateColumns } from "./LimsSampleTemplate.columns";
import {
  limsSampleTemplateKeys,
  useBulkCloneLimsSampleTemplate,
  useBulkCopyLimsSampleTemplate,
  useBulkDeleteLimsSampleTemplate,
  useBulkUpdateLimsSampleTemplate,
  useCreateLimsSampleTemplate,
  useLimsSampleTemplateAudit,
  useRestoreLimsSampleTemplate,
  useBulkRestoreLimsSampleTemplate,
  useUpdateLimsSampleTemplate,
  useLimsSampleTemplateById
} from "./LimsSampleTemplate.queries";
import LimsSampleTemplateForm, {
  type LimsSampleTemplateFormMode
} from "./LimsSampleTemplateForm";
import type {
  LimsSampleTemplate,
  LimsSampleTemplatePayload
} from "./LimsSampleTemplate.types";

/** LIMS Test Groups — system sample templates are seeded by the backend and must not be removed
 * or cloned (hidden per row); their values can still be edited. */
const LimsSampleTemplateList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] =
    useState<LimsSampleTemplateFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<
    LimsSampleTemplate,
    LimsSampleTemplatePayload
  >();
  const auditQuery = useLimsSampleTemplateAudit(compliance.auditRow?.id);
  const detailQuery = useLimsSampleTemplateById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsSampleTemplateList>[1],
      signal?: AbortSignal
    ) => fetchLimsSampleTemplateList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsSampleTemplate>({
    entity: "limsSampleTemplate",
    queryKey: [...limsSampleTemplateKeys.all, { includeRemoved }],
    fetchList
  });

  const createPhrase = useCreateLimsSampleTemplate();
  const updatePhrase = useUpdateLimsSampleTemplate();
  const bulkClone = useBulkCloneLimsSampleTemplate();
  const bulkCopy = useBulkCopyLimsSampleTemplate();
  const bulkDelete = useBulkDeleteLimsSampleTemplate();
  const bulkUpdate = useBulkUpdateLimsSampleTemplate();
  const restorePhrase = useRestoreLimsSampleTemplate();
  const bulkRestoreSampleTemplate = useBulkRestoreLimsSampleTemplate();

  const busy =
    createPhrase.isPending ||
    updatePhrase.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restorePhrase.isPending ||
    bulkRestoreSampleTemplate.isPending;

  const columnDefs = useMemo(() => getLimsSampleTemplateColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsSampleTemplateFormMode, phrase: LimsSampleTemplate | null) => {
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

  const handleSaveCopies = async (payloads: LimsSampleTemplatePayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (
    updates: { id: string; payload: LimsSampleTemplatePayload }[]
  ) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsSampleTemplatePayload) => {
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
        permission: LIMS_PERMISSIONS.VIEW_SAMPLE_TEMPLATE,
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
        permission: LIMS_PERMISSIONS.CREATE_SAMPLE_TEMPLATE,
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
        permission: LIMS_PERMISSIONS.UPDATE_SAMPLE_TEMPLATE,
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
        permission: LIMS_PERMISSIONS.UPDATE_SAMPLE_TEMPLATE,
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
        permission: LIMS_PERMISSIONS.DELETE_SAMPLE_TEMPLATE,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsSampleTemplate>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_SAMPLE_TEMPLATE,
        onClick: (phrase) => openForm("view", phrase)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_SAMPLE_TEMPLATE,
        onClick: (phrase) => openForm("edit", phrase)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_SAMPLE_TEMPLATE,
        onClick: (phrase) => compliance.openAudit(phrase)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_SAMPLE_TEMPLATE,
        onClick: (phrase) => openCopy([phrase.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_SAMPLE_TEMPLATE,
        hidden: (phrase: LimsSampleTemplate) => !phrase.isRemoved,
        onClick: (phrase) => compliance.requestRestore(phrase)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_SAMPLE_TEMPLATE,
        hidden: (phrase: LimsSampleTemplate) => Boolean(phrase.isRemoved),
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
      <DataTable<LimsSampleTemplate>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsSampleTemplates")}
        searchPlaceholder="Search sample templates…"
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
            label: t("create", { entity: t("limsSampleTemplate") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_SAMPLE_TEMPLATE,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoSampleTemplates") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsSampleTemplate, LimsSampleTemplatePayload>
            ids={copyIds}
            fetchById={fetchLimsSampleTemplateById}
            FormComponent={LimsSampleTemplateForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsSampleTemplate")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsSampleTemplate>
            ids={viewIds}
            fetchById={fetchLimsSampleTemplateById}
            FormComponent={LimsSampleTemplateForm}
            onClose={handleCloseForm}
            entityLabel={t("limsSampleTemplate")}
          />
        ) : editIds ? (
          <EditStepper<LimsSampleTemplate, LimsSampleTemplatePayload>
            ids={editIds}
            fetchById={fetchLimsSampleTemplateById}
            FormComponent={LimsSampleTemplateForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsSampleTemplate")}
          />
        ) : formMode !== "create" &&
          (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsSampleTemplateForm
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
        entityLabel="sample template"
        entityLabelPlural="sample templates"
        getRecordLabel={(row) => row.sampleTemplateId || row.name}
        updating={updatePhrase.isPending}
        deleting={bulkDelete.isPending}
        restoring={restorePhrase.isPending}
        bulkRestoring={bulkRestoreSampleTemplate.isPending}
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
            await bulkRestoreSampleTemplate.mutateAsync({
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

export default LimsSampleTemplateList;
