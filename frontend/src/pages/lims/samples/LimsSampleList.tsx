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
import BulkCountDialog from "@/components/lims/BulkCountDialog";
import AsyncSelect from "@/components/data/AsyncSelect";
import Label from "@/components/common/form/Label";
import { useBulkCreateFlow } from "@/hooks/useBulkCreateFlow";
import { MAX_BULK_CREATE } from "@/lib/limsBulk";
import { fetchLimsSampleTemplateById } from "@/pages/lims/sample-templates/LimsSampleTemplate.api";
import { useLimsSampleTemplateOptions } from "@/pages/lims/sample-templates/LimsSampleTemplate.queries";
import type { LimsSampleTemplate } from "@/pages/lims/sample-templates/LimsSampleTemplate.types";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsSampleById, fetchLimsSampleList } from "./LimsSample.api";
import { getLimsSampleColumns } from "./LimsSample.columns";
import {
  limsSampleKeys,
  useBulkCloneLimsSample,
  useBulkCopyLimsSample,
  useBulkCreateLimsSample,
  useBulkDeleteLimsSample,
  useBulkUpdateLimsSample,
  useCreateLimsSample,
  useLimsSampleAudit,
  useRestoreLimsSample,
  useBulkRestoreLimsSample,
  useUpdateLimsSample,
  useLimsSampleById
} from "./LimsSample.queries";
import LimsSampleForm, { type LimsSampleFormMode } from "./LimsSampleForm";
import type { LimsSample, LimsSamplePayload } from "./LimsSample.types";

/** A Sample Template's values as a new sample's starting record (never linked back to it). */
const sampleFromTemplate = (tpl: LimsSampleTemplate): LimsSample =>
  ({
    sampleType: tpl.sampleType ?? null,
    project: tpl.project ?? null,
    specification: tpl.specification ?? null,
    location: tpl.location ?? null,
    group: tpl.group ?? null,
    lotNumber: tpl.lotNumber ?? "",
    serialNumber: tpl.serialNumber ?? "",
    loginDate: tpl.loginDate ?? "",
    loginBy: tpl.loginBy ?? "",
    sampleStartDate: tpl.sampleStartDate ?? "",
    sampleStartBy: tpl.sampleStartBy ?? "",
    description: tpl.description ?? "",
    comments: tpl.comments ?? "",
    tests: [...(tpl.tests ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((row) => ({
        id: "",
        analysisId: row.analysisId ?? row.analysis?.id,
        testName: row.analysis?.name,
        status: "Open"
      }))
  }) as unknown as LimsSample;

/** LimsSample list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsSampleList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsSampleFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);
  const bulkFlow = useBulkCreateFlow<LimsSample>(fetchLimsSampleById);
  const { askCopy } = bulkFlow;
  const [templateId, setTemplateId] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);

  const compliance = useLimsCompliance<LimsSample, LimsSamplePayload>();
  const auditQuery = useLimsSampleAudit(compliance.auditRow?.id);
  const detailQuery = useLimsSampleById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsSampleList>[1], signal?: AbortSignal) =>
      fetchLimsSampleList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsSample>({
    entity: "limsSample",
    queryKey: [...limsSampleKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsSample();
  const update = useUpdateLimsSample();
  const bulkClone = useBulkCloneLimsSample();
  const bulkCopy = useBulkCopyLimsSample();
  const bulkCreate = useBulkCreateLimsSample();
  const bulkDelete = useBulkDeleteLimsSample();
  const bulkUpdate = useBulkUpdateLimsSample();
  const restore = useRestoreLimsSample();
  const bulkRestoreSample = useBulkRestoreLimsSample();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkCreate.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending ||
    bulkRestoreSample.isPending;

  const columnDefs = useMemo(() => getLimsSampleColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsSampleFormMode, row: LimsSample | null) => {
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
    bulkFlow.reset();
    setTemplateId("");
  };

  // "How many?" → 1 with no template is the ordinary single form (keeps attachments);
  // anything else opens the stepper in bulk-create mode.
  const confirmCreateCount = async (count: number) => {
    if (count === 1 && !templateId) {
      bulkFlow.reset();
      openForm("create", null);
      return;
    }
    let start = {} as LimsSample;
    if (templateId) {
      setTemplateLoading(true);
      try {
        start = sampleFromTemplate(
          await fetchLimsSampleTemplateById(templateId)
        );
      } finally {
        setTemplateLoading(false);
      }
    }
    bulkFlow.startCreate(count, start);
  };

  const handleSaveCreated = async (payloads: LimsSamplePayload[]) => {
    await bulkCreate.mutateAsync(payloads);
    handleCloseForm();
  };

  const handleSaveCopies = async (payloads: LimsSamplePayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (
    updates: { id: string; payload: LimsSamplePayload }[]
  ) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleSave = async (payload: LimsSamplePayload, files: File[]) => {
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

  const label = (row: LimsSample) =>
    String(row.sampleId ?? row.sampleName ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_SAMPLE,
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
        permission: LIMS_PERMISSIONS.CREATE_SAMPLE,
        onClick: async (selection) => {
          if (selection.mode === "ids") {
            // One record selected → "How many copies?"; several → one copy each, as before.
            if (selection.ids.length === 1) {
              askCopy(selection.ids[0], t("limsSample"));
              openModal();
              return;
            }
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
        permission: LIMS_PERMISSIONS.UPDATE_SAMPLE,
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
        permission: LIMS_PERMISSIONS.UPDATE_SAMPLE,
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
        permission: LIMS_PERMISSIONS.DELETE_SAMPLE,
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
    [
      askCopy,
      bulkClone,
      compliance,
      openCopy,
      openEdit,
      openModal,
      openView,
      t,
      table
    ]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsSample>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_SAMPLE,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_SAMPLE,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_SAMPLE,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_SAMPLE,
        onClick: (row) => {
          askCopy(row.id, label(row));
          openModal();
        }
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_SAMPLE,
        hidden: (row: LimsSample) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_SAMPLE,
        hidden: (row: LimsSample) => Boolean(row.isRemoved),
        onClick: (row) =>
          compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [
            label(row)
          ])
      }
    ],
    [askCopy, compliance, openModal, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsSample>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsSamples")}
        searchPlaceholder={t("search", { entity: t("limsSamples") })}
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
            label: t("create", { entity: t("limsSample") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_SAMPLE,
            onClick: () => {
              bulkFlow.askCreate();
              openModal();
            }
          }
        ]}
        emptyState={{ title: t("limsNoSamples") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1100px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {bulkFlow.prompt?.kind === "create" ? (
          <BulkCountDialog
            title={t("limsHowManyCreate", { entity: t("limsSamples") })}
            countLabel={t("limsNumberOf", { entity: t("limsSamples") })}
            hint={t("limsHowManyHint", { max: MAX_BULK_CREATE })}
            onCancel={handleCloseForm}
            onConfirm={confirmCreateCount}
            busy={templateLoading}
          >
            <div>
              <Label tooltip={t("limsStartFromTemplateHint")}>
                {t("limsStartFromTemplate")}
              </Label>
              <AsyncSelect
                useOptions={useLimsSampleTemplateOptions}
                value={templateId}
                onChange={setTemplateId}
                placeholder={t("select", { entity: t("limsSampleTemplate") })}
              />
            </div>
          </BulkCountDialog>
        ) : bulkFlow.prompt?.kind === "copy" ? (
          <BulkCountDialog
            title={t("limsHowManyCopy", { name: bulkFlow.prompt.name })}
            countLabel={t("limsNumberOfCopies")}
            hint={t("limsHowManyCopyHint", { max: MAX_BULK_CREATE })}
            onCancel={handleCloseForm}
            onConfirm={(count) => {
              if (bulkFlow.prompt?.kind === "copy")
                bulkFlow.startCopy(bulkFlow.prompt.id, count);
            }}
          />
        ) : bulkFlow.createIds ? (
          <CopyStepper<LimsSample, LimsSamplePayload, LimsSampleFormMode>
            ids={bulkFlow.createIds}
            fetchById={bulkFlow.fetchNew}
            FormComponent={LimsSampleForm}
            formMode="bulk-create"
            onSaveAll={handleSaveCreated}
            onClose={handleCloseForm}
            saving={bulkCreate.isPending}
            entityLabel={t("limsSample")}
          />
        ) : bulkFlow.copyIds ? (
          <CopyStepper<LimsSample, LimsSamplePayload>
            ids={bulkFlow.copyIds}
            fetchById={bulkFlow.fetchSource}
            FormComponent={LimsSampleForm}
            onSaveAll={handleSaveCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending}
            entityLabel={t("limsSample")}
          />
        ) : copyIds ? (
          <CopyStepper<LimsSample, LimsSamplePayload>
            ids={copyIds}
            fetchById={fetchLimsSampleById}
            FormComponent={LimsSampleForm}
            onSaveAll={handleSaveCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsSample")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsSample>
            ids={viewIds}
            fetchById={fetchLimsSampleById}
            FormComponent={LimsSampleForm}
            onClose={handleCloseForm}
            entityLabel={t("limsSample")}
          />
        ) : editIds ? (
          <EditStepper<LimsSample, LimsSamplePayload>
            ids={editIds}
            fetchById={fetchLimsSampleById}
            FormComponent={LimsSampleForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsSample")}
          />
        ) : formMode !== "create" &&
          (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsSampleForm
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
        entityLabel={t("limsSample")}
        entityLabelPlural={t("limsSamples")}
        getRecordLabel={label}
        updating={update.isPending}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        bulkRestoring={bulkRestoreSample.isPending}
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
            await restore.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
        onBulkRestore={async (reason) => {
          const pending = compliance.pendingBulkRestore;
          if (pending) {
            await bulkRestoreSample.mutateAsync({
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

export default LimsSampleList;
