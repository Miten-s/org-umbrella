import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { NEW_ENTITY_TEMPLATE, entityTemplateUrl } from "./entityTemplateRoutes";

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
  fetchLimsEntityTemplateById,
  fetchLimsEntityTemplateList
} from "./LimsEntityTemplate.api";
import { getLimsEntityTemplateColumns } from "./LimsEntityTemplate.columns";
import {
  limsEntityTemplateKeys,
  useBulkCloneLimsEntityTemplate,
  useBulkCopyLimsEntityTemplate,
  useBulkDeleteLimsEntityTemplate,
  useBulkUpdateLimsEntityTemplate,
  useCreateLimsEntityTemplate,
  useLimsEntityTemplateAudit,
  useRestoreLimsEntityTemplate,
  useBulkRestoreLimsEntityTemplate,
  useUpdateLimsEntityTemplate,
  useLimsEntityTemplateById
} from "./LimsEntityTemplate.queries";
import LimsEntityTemplateForm, {
  type LimsEntityTemplateFormMode
} from "./LimsEntityTemplateForm";
import type {
  LimsEntityTemplate,
  LimsEntityTemplatePayload
} from "./LimsEntityTemplate.types";

/** Entity Templates: reusable tables-plus-conditions for Entity components. */
const LimsEntityTemplateList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] =
    useState<LimsEntityTemplateFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<
    LimsEntityTemplate,
    LimsEntityTemplatePayload
  >();
  const auditQuery = useLimsEntityTemplateAudit(compliance.auditRow?.id);
  const detailQuery = useLimsEntityTemplateById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsEntityTemplateList>[1],
      signal?: AbortSignal
    ) => fetchLimsEntityTemplateList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsEntityTemplate>({
    entity: "limsEntityTemplate",
    queryKey: [...limsEntityTemplateKeys.all, { includeRemoved }],
    fetchList
  });

  const createPhrase = useCreateLimsEntityTemplate();
  const updatePhrase = useUpdateLimsEntityTemplate();
  const bulkClone = useBulkCloneLimsEntityTemplate();
  const bulkCopy = useBulkCopyLimsEntityTemplate();
  const bulkDelete = useBulkDeleteLimsEntityTemplate();
  const bulkUpdate = useBulkUpdateLimsEntityTemplate();
  const restorePhrase = useRestoreLimsEntityTemplate();
  const bulkRestoreSampleTemplate = useBulkRestoreLimsEntityTemplate();

  const busy =
    createPhrase.isPending ||
    updatePhrase.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restorePhrase.isPending ||
    bulkRestoreSampleTemplate.isPending;

  const columnDefs = useMemo(() => getLimsEntityTemplateColumns({ t }), [t]);

  // One template opens on its own page; several are reviewed side by side in the modal.
  const openCopy = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        navigate(
          `${entityTemplateUrl(NEW_ENTITY_TEMPLATE)}?copyFrom=${ids[0]}`
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
        navigate(`${entityTemplateUrl(ids[0])}?mode=view`);
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
        navigate(entityTemplateUrl(ids[0]));
        return;
      }
      setEditIds(ids);
      openModal();
    },
    [openModal, navigate]
  );

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: LimsEntityTemplatePayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (
    updates: { id: string; payload: LimsEntityTemplatePayload }[]
  ) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsEntityTemplatePayload) => {
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
        permission: LIMS_PERMISSIONS.VIEW_ENTITY_TEMPLATE,
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
        permission: LIMS_PERMISSIONS.CREATE_ENTITY_TEMPLATE,
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
        permission: LIMS_PERMISSIONS.UPDATE_ENTITY_TEMPLATE,
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
        permission: LIMS_PERMISSIONS.UPDATE_ENTITY_TEMPLATE,
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
        permission: LIMS_PERMISSIONS.DELETE_ENTITY_TEMPLATE,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsEntityTemplate>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_ENTITY_TEMPLATE,
        onClick: (phrase) => openView([phrase.id])
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_ENTITY_TEMPLATE,
        onClick: (phrase) => openEdit([phrase.id])
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_ENTITY_TEMPLATE,
        onClick: (phrase) => compliance.openAudit(phrase)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_ENTITY_TEMPLATE,
        onClick: (phrase) => openCopy([phrase.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_ENTITY_TEMPLATE,
        hidden: (phrase: LimsEntityTemplate) => !phrase.isRemoved,
        onClick: (phrase) => compliance.requestRestore(phrase)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_ENTITY_TEMPLATE,
        hidden: (phrase: LimsEntityTemplate) => Boolean(phrase.isRemoved),
        onClick: (phrase) =>
          compliance.requestDelete({ mode: "ids", ids: [phrase.id] }, 1, [
            phrase.name
          ])
      }
    ],
    [compliance, openCopy, openEdit, openView, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsEntityTemplate>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsEntityTemplates")}
        searchPlaceholder="Search entity templates…"
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
            label: t("create", { entity: t("limsEntityTemplate") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_ENTITY_TEMPLATE,
            onClick: () => navigate(entityTemplateUrl(NEW_ENTITY_TEMPLATE))
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
          <CopyStepper<LimsEntityTemplate, LimsEntityTemplatePayload>
            ids={copyIds}
            fetchById={fetchLimsEntityTemplateById}
            FormComponent={LimsEntityTemplateForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsEntityTemplate")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsEntityTemplate>
            ids={viewIds}
            fetchById={fetchLimsEntityTemplateById}
            FormComponent={LimsEntityTemplateForm}
            onClose={handleCloseForm}
            entityLabel={t("limsEntityTemplate")}
          />
        ) : editIds ? (
          <EditStepper<LimsEntityTemplate, LimsEntityTemplatePayload>
            ids={editIds}
            fetchById={fetchLimsEntityTemplateById}
            FormComponent={LimsEntityTemplateForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsEntityTemplate")}
          />
        ) : formMode !== "create" &&
          (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsEntityTemplateForm
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
        entityLabel="entity template"
        entityLabelPlural="entity templates"
        getRecordLabel={(row) => row.entityTemplateId || row.name}
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

export default LimsEntityTemplateList;
