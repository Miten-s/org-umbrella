import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { toast } from "@/lib/toast";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applicationKeys,
  useApplicationDetail,
  useBulkCloneApplication,
  useBulkCopyApplication,
  useBulkDeleteApplication,
  useBulkRestoreApplication,
  useBulkUpdateApplication,
  useCreateApplication,
  useToggleApplicationStatus,
  useUpdateApplication
} from "./GxpApplication.queries";
import { fetchApplicationById, fetchApplicationList } from "./GxpApplication.api";
import { getApplicationColumns } from "./GxpApplication.columns";
import GxpApplicationForm, { type ApplicationFormMode } from "./GxpApplicationForm";
import type { ApplicationFormValues } from "./GxpApplication.schema";
import type { GxpApplication } from "./GxpApplication.types";
import type { BulkSelection } from "@/lib/query/listTypes";

const GxpApplicationList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<ApplicationFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  // Set instead of activeId/formMode while the Copy/View/Edit review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BulkSelection | null>(null);
  const [restoreNames, setRestoreNames] = useState<string[]>([]);

  const table = useServerTable<GxpApplication>({
    entity: "gxpApplication",
    queryKey: [...applicationKeys.all, { includeDisabled }],
    fetchList: useCallback((params, signal) => fetchApplicationList(includeDisabled, params, signal), [includeDisabled])
  });

  // On edit/view we need the full record (nested refs) to seed the form.
  const detail = useApplicationDetail(activeId, isOpen && formMode !== "create");
  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();
  const bulkClone = useBulkCloneApplication();
  const bulkCopy = useBulkCopyApplication();
  const bulkDelete = useBulkDeleteApplication();
  const bulkUpdate = useBulkUpdateApplication();
  const bulkRestore = useBulkRestoreApplication();
  const toggleStatus = useToggleApplicationStatus();
  const busy =
    createApp.isPending ||
    updateApp.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    bulkRestore.isPending ||
    toggleStatus.isPending;

  // Stable across renders — the toggle's live pending state goes through
  // gridContext instead, so a status click doesn't give ag-grid a new
  // cellRenderer identity (which would force a destroy/recreate of the cell
  // and kill the Switch's transition — see GxpApplication.columns.tsx).
  const columnDefs = useMemo(() => getApplicationColumns({ t }), [t]);

  const gridContext = useMemo(
    () => ({
      toggleDisabled: toggleStatus.isPending,
      togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
      onToggleStatus: (app: GxpApplication) => {
        if (toggleStatus.isPending) return;
        toggleStatus.mutate(app);
      }
    }),
    [toggleStatus]
  );

  const openForm = (mode: ApplicationFormMode, id: string | null) => {
    setFormMode(mode);
    setActiveId(id);
    openModal();
  };

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

  const handleClose = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSave = async (values: ApplicationFormValues, newFiles: File[] = []) => {
    if (activeId) {
      await updateApp.mutateAsync({ id: activeId, payload: values, files: newFiles });
    } else {
      await createApp.mutateAsync({ payload: values, files: newFiles });
    }
    handleClose();
  };

  const handleSaveCopies = async (payloads: ApplicationFormValues[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleClose();
    table.clearSelection();
  };

  const handleSaveEdits = async (updates: { id: string; payload: ApplicationFormValues }[]) => {
    await bulkUpdate.mutateAsync(updates);
    handleClose();
    table.clearSelection();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (c) => (c > 1 ? "View applications" : "View application"),
        icon: EyeIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.VIEW_SOFTWARE,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to view.", "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: (c) => (c > 1 ? "Copy applications" : "Copy application"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_SOFTWARE,
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
        label: (c) => (c > 1 ? "Edit applications" : "Edit application"),
        icon: PencilIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_SOFTWARE,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to edit.", "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "restore",
        label: (c) => (c > 1 ? "Restore applications" : "Restore application"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_SOFTWARE,
        hidden: (rows) => !(rows as GxpApplication[]).some((row) => row.status === "disabled"),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to restore.", "error");
            return;
          }
          setPendingRestore(selection);
          setRestoreNames(table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.applicationName));
        }
      },
      {
        key: "delete",
        label: (c) => (c > 1 ? "Delete applications" : "Delete application"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_SOFTWARE,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(selection.mode === "ids" ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.applicationName) : []);
        }
      }
    ],
    [bulkClone, openCopy, openEdit, openView, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpApplication>[]>(
    () => [
      { key: "view", label: "View application", icon: EyeIcon, placement: "inline", permission: GXP_PERMISSIONS.VIEW_SOFTWARE, onClick: (a) => openForm("view", a.id) },
      { key: "edit", label: "Edit application", icon: PencilIcon, placement: "inline", permission: GXP_PERMISSIONS.UPDATE_SOFTWARE, onClick: (a) => openForm("edit", a.id) },
      {
        key: "clone", label: "Copy application", icon: CopyIcon, placement: "menu", permission: GXP_PERMISSIONS.CREATE_SOFTWARE,
        onClick: (a) => openCopy([a.id])
      },
      {
        key: "restore", label: "Restore application", icon: CopyIcon, placement: "menu", permission: GXP_PERMISSIONS.UPDATE_SOFTWARE,
        hidden: (a) => a.status !== "disabled",
        onClick: (a) => { setPendingRestore({ mode: "ids", ids: [a.id] }); setRestoreNames([a.applicationName]); }
      },
      {
        key: "delete", label: "Delete application", icon: TrashBinIcon, placement: "menu", tone: "danger", permission: GXP_PERMISSIONS.DELETE_SOFTWARE,
        onClick: (a) => { setPendingDelete({ mode: "ids", ids: [a.id] }); setDeleteCount(1); setDeleteNames([a.applicationName]); }
      }
    ],
    [openCopy, openForm]
  );

  // For edit/view, wait for a FRESH fetch before rendering the form — otherwise
  // React Query serves the previous (stale) cache for this id while it refetches,
  // flashing old values. isFetching covers both first load and background refetch.
  const showForm = formMode === "create" || (!!detail.data && !detail.isFetching);

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<GxpApplication>
        table={table}
        columnDefs={columnDefs}
        gridContext={gridContext}
        tableName={t("gxpApplications")}
        searchPlaceholder="Search applications…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        titleExtra={<Switch label={t("includeDisabled")} checked={includeDisabled} onChange={setIncludeDisabled} />}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          { key: "create", label: t("create", { entity: t("gxpApplications") }), icon: PlusIcon, variant: "primary", permission: GXP_PERMISSIONS.CREATE_SOFTWARE, onClick: () => openForm("create", null) }
        ]}
        emptyState={{ title: "No applications found" }}
      />

      <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-h-[calc(100dvh-2rem)] max-w-[1000px] overflow-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-white" disableOuterScroll>
        {copyIds ? (
          <CopyStepper<GxpApplication, ApplicationFormValues>
            ids={copyIds}
            fetchById={fetchApplicationById}
            FormComponent={GxpApplicationForm}
            onSaveAll={handleSaveCopies}
            onClose={handleClose}
            saving={bulkCopy.isPending}
            entityLabel={t("gxpApplications")}
          />
        ) : viewIds ? (
          <ViewStepper<GxpApplication>
            ids={viewIds}
            fetchById={fetchApplicationById}
            FormComponent={GxpApplicationForm}
            onClose={handleClose}
            entityLabel={t("gxpApplications")}
          />
        ) : editIds ? (
          <EditStepper<GxpApplication, ApplicationFormValues>
            ids={editIds}
            fetchById={fetchApplicationById}
            FormComponent={GxpApplicationForm}
            onSaveAll={handleSaveEdits}
            onClose={handleClose}
            saving={bulkUpdate.isPending}
            entityLabel={t("gxpApplications")}
          />
        ) : showForm ? (
          <GxpApplicationForm
            mode={formMode}
            initialData={formMode === "create" ? null : (detail.data ?? null)}
            onClose={handleClose}
            onSubmit={handleSave}
            submitting={createApp.isPending || updateApp.isPending}
          />
        ) : (
          <div className="flex items-center justify-center p-10 text-sm text-gray-500">Loading…</div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={deleteCount > 1 ? `Are you sure you want to delete these ${deleteCount} applications?` : "Are you sure you want to delete this application?"}
        onConfirm={async () => {
          if (pendingDelete) { await bulkDelete.mutateAsync(pendingDelete); table.clearSelection(); }
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        isOpen={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        loading={bulkRestore.isPending}
        items={restoreNames}
        description={restoreNames.length > 1 ? `Are you sure you want to restore these ${restoreNames.length} applications?` : "Are you sure you want to restore this application?"}
        onConfirm={async () => {
          if (pendingRestore) { await bulkRestore.mutateAsync(pendingRestore); table.clearSelection(); }
          setPendingRestore(null);
        }}
      />
    </div>
  );
};

export default GxpApplicationList;
