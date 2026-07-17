import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applicationKeys,
  useApplicationDetail,
  useBulkCloneApplication,
  useBulkDeleteApplication,
  useCreateApplication,
  useToggleApplicationStatus,
  useUpdateApplication
} from "./GxpApplication.queries";
import { fetchApplicationList } from "./GxpApplication.api";
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
  const bulkDelete = useBulkDeleteApplication();
  const toggleStatus = useToggleApplicationStatus();
  const busy = createApp.isPending || updateApp.isPending || bulkClone.isPending || bulkDelete.isPending || toggleStatus.isPending;

  const columnDefs = useMemo(
    () =>
      getApplicationColumns({
        t,
        toggleDisabled: toggleStatus.isPending,
        togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
        onToggleStatus: (app) => {
          if (toggleStatus.isPending) return;
          toggleStatus.mutate(app);
        }
      }),
    [t, toggleStatus]
  );

  const openForm = (mode: ApplicationFormMode, id: string | null) => {
    setFormMode(mode);
    setActiveId(id);
    openModal();
  };
  const handleClose = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
  };

  const handleSave = async (values: ApplicationFormValues, newFiles: File[]) => {
    if (activeId) {
      await updateApp.mutateAsync({ id: activeId, payload: values, files: newFiles });
    } else {
      await createApp.mutateAsync({ payload: values, files: newFiles });
    }
    handleClose();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (c) => (c > 1 ? "Copy applications" : "Copy application"),
        icon: PlusIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_SOFTWARE,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
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
    [bulkClone, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpApplication>[]>(
    () => [
      { key: "view", label: "View application", icon: EyeIcon, placement: "inline", permission: GXP_PERMISSIONS.VIEW_SOFTWARE, onClick: (a) => openForm("view", a.id) },
      { key: "edit", label: "Edit application", icon: PencilIcon, placement: "inline", permission: GXP_PERMISSIONS.UPDATE_SOFTWARE, onClick: (a) => openForm("edit", a.id) },
      {
        key: "delete", label: "Delete application", icon: TrashBinIcon, placement: "menu", tone: "danger", permission: GXP_PERMISSIONS.DELETE_SOFTWARE,
        onClick: (a) => { setPendingDelete({ mode: "ids", ids: [a.id] }); setDeleteCount(1); setDeleteNames([a.applicationName]); }
      }
    ],
    []
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

      <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-h-[calc(100dvh-2rem)] max-w-[1000px] overflow-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        {showForm ? (
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
    </div>
  );
};

export default GxpApplicationList;
