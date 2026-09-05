import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { toast } from "@/lib/toast";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  moduleKeys,
  useBulkCloneModule,
  useBulkCopyModule,
  useBulkDeleteModule,
  useBulkRestoreModule,
  useBulkUpdateModule,
  useCreateModule,
  useModuleById,
  useToggleModuleStatus,
  useUpdateModule
} from "./Module.queries";
import { fetchModuleById, fetchModuleList } from "./Module.api";
import { getModuleColumns } from "./Module.columns";
import ModuleForm, { type ModuleFormMode } from "./ModuleForm";
import type { ModuleFormValues } from "./Module.schema";
import {
  getModuleApplicationId,
  normalizeModuleName,
  type ApplicationSoftwareModule
} from "./Module.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/** App/Software Module (GXP) — migrated via MIGRATION.md checklist (Track A batch). */
const ModuleList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<ApplicationSoftwareModule | null>(null);
  const [formMode, setFormMode] = useState<ModuleFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  // Set instead of active/formMode while the Copy/View/Edit review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BulkSelection | null>(null);
  const [restoreNames, setRestoreNames] = useState<string[]>([]);

  const table = useServerTable<ApplicationSoftwareModule>({
    entity: "module",
    queryKey: [...moduleKeys.all, { includeDisabled }],
    fetchList: useCallback(
      (params, signal) => fetchModuleList(includeDisabled, params, signal),
      [includeDisabled]
    )
  });

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const bulkClone = useBulkCloneModule();
  const bulkCopy = useBulkCopyModule();
  const bulkDelete = useBulkDeleteModule();
  const bulkUpdate = useBulkUpdateModule();
  const bulkRestore = useBulkRestoreModule();
  const toggleStatus = useToggleModuleStatus();
  const busy =
    createModule.isPending ||
    updateModule.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    bulkRestore.isPending ||
    toggleStatus.isPending;

  // Stable across renders — the toggle's live pending state goes through
  // gridContext instead, so a status click doesn't give ag-grid a new
  // cellRenderer identity (which would force a destroy/recreate of the cell
  // and kill the Switch's transition — see Module.columns.tsx).
  const columnDefs = useMemo(() => getModuleColumns({ t }), [t]);

  // Row actions seed `active` from the list's own (potentially stale) row — refetch it
  // fresh here so an application linked to this module from the Application side shows up,
  // same fix as GxpApplicationList's `useApplicationDetail`.
  const activeDetail = useModuleById(active?.id, isOpen && formMode !== "create");

  const gridContext = useMemo(
    () => ({
      toggleDisabled: toggleStatus.isPending,
      togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
      onToggleStatus: (module: ApplicationSoftwareModule) => {
        if (toggleStatus.isPending) return;
        toggleStatus.mutate(module);
      }
    }),
    [toggleStatus]
  );

  const openForm = (mode: ModuleFormMode, module: ApplicationSoftwareModule | null) => {
    setFormMode(mode);
    setActive(module);
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

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: ModuleFormValues[]) => {
    await bulkCopy.mutateAsync(
      payloads.map((values) => ({ ...values, application: (values.application ?? "").trim() || undefined }))
    );
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = async (updates: { id: string; payload: ModuleFormValues }[]) => {
    await bulkUpdate.mutateAsync(
      updates.map(({ id, payload }) => ({
        id,
        payload: { ...payload, application: (payload.application ?? "").trim() || undefined }
      }))
    );
    handleCloseForm();
    table.clearSelection();
  };

  const handleSave = async (values: ModuleFormValues) => {
    // Client-side duplicate-name check (ported verbatim): a module with the same
    // normalized name for the same application may not exist. Checks loaded rows.
    const nextModuleName = normalizeModuleName(values.moduleName);
    const nextApplicationId = (values.application ?? "").trim();
    const duplicate = nextApplicationId
      ? table.rows.find((module) => {
          if (active?.id === module.id) return false;
          if (normalizeModuleName(module.moduleName) !== nextModuleName) return false;
          return getModuleApplicationId(module) === nextApplicationId;
        })
      : undefined;
    if (duplicate) {
      toast("This module name already exists for the selected application.", "error");
      return;
    }

    const payload = { ...values, application: nextApplicationId || undefined };
    if (active) {
      await updateModule.mutateAsync({ id: active.id, payload });
    } else {
      await createModule.mutateAsync(payload);
    }
    handleCloseForm();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (count) => (count > 1 ? "View modules" : "View module"),
        icon: EyeIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.VIEW_SOFTWARE_MODULES,
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
        label: (count) => (count > 1 ? "Copy modules" : "Copy module"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_SOFTWARE_MODULES,
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
        label: (count) => (count > 1 ? "Edit modules" : "Edit module"),
        icon: PencilIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_SOFTWARE_MODULES,
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
        label: (count) => (count > 1 ? "Restore modules" : "Restore module"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_SOFTWARE_MODULES,
        hidden: (rows) => !(rows as ApplicationSoftwareModule[]).some((row) => row.status === "disabled"),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to restore.", "error");
            return;
          }
          setPendingRestore(selection);
          setRestoreNames(table.getCachedRows(selection.ids).map((r) => r.moduleName));
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete modules" : "Delete module"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_SOFTWARE_MODULES,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.getCachedRows(selection.ids).map((r) => r.moduleName)
              : []
          );
        }
      }
    ],
    [bulkClone, openCopy, openEdit, openView, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<ApplicationSoftwareModule>[]>(
    () => [
      {
        key: "view",
        label: "View module",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_SOFTWARE_MODULES,
        onClick: (module) => openForm("view", module)
      },
      {
        key: "edit",
        label: "Edit module",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_SOFTWARE_MODULES,
        onClick: (module) => openForm("edit", module)
      },
      {
        key: "clone",
        label: "Copy module",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.CREATE_SOFTWARE_MODULES,
        onClick: (module) => openCopy([module.id])
      },
      {
        key: "restore",
        label: "Restore module",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.UPDATE_SOFTWARE_MODULES,
        hidden: (module) => module.status !== "disabled",
        onClick: (module) => {
          setPendingRestore({ mode: "ids", ids: [module.id] });
          setRestoreNames([module.moduleName]);
        }
      },
      {
        key: "delete",
        label: "Delete module",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: GXP_PERMISSIONS.DELETE_SOFTWARE_MODULES,
        onClick: (module) => {
          setPendingDelete({ mode: "ids", ids: [module.id] });
          setDeleteCount(1);
          setDeleteNames([module.moduleName]);
        }
      }
    ],
    [openCopy, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<ApplicationSoftwareModule>
        table={table}
        columnDefs={columnDefs}
        gridContext={gridContext}
        tableName={t("gxpApplicationSoftwareModule")}
        searchPlaceholder="Search modules…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        titleExtra={
          <Switch label={t("includeDisabled")} checked={includeDisabled} onChange={setIncludeDisabled} />
        }
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("module") }),
            icon: PlusIcon,
            variant: "primary",
            permission: GXP_PERMISSIONS.CREATE_SOFTWARE_MODULES,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No modules found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<ApplicationSoftwareModule, ModuleFormValues>
            ids={copyIds}
            fetchById={fetchModuleById}
            FormComponent={ModuleForm}
            onSaveAll={handleSaveCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending}
            entityLabel={t("module")}
          />
        ) : viewIds ? (
          <ViewStepper<ApplicationSoftwareModule>
            ids={viewIds}
            fetchById={fetchModuleById}
            FormComponent={ModuleForm}
            onClose={handleCloseForm}
            entityLabel={t("module")}
          />
        ) : editIds ? (
          <EditStepper<ApplicationSoftwareModule, ModuleFormValues>
            ids={editIds}
            fetchById={fetchModuleById}
            FormComponent={ModuleForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("module")}
          />
        ) : (
          <ModuleForm
            mode={formMode}
            initialData={formMode === "create" ? null : (activeDetail.data ?? null)}
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createModule.isPending || updateModule.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={
          deleteCount > 1
            ? `Are you sure you want to delete these ${deleteCount} modules?`
            : "Are you sure you want to delete this module?"
        }
        onConfirm={async () => {
          if (pendingDelete) {
            await bulkDelete.mutateAsync(pendingDelete);
            table.clearSelection();
          }
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        isOpen={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        loading={bulkRestore.isPending}
        items={restoreNames}
        description={
          restoreNames.length > 1
            ? `Are you sure you want to restore these ${restoreNames.length} modules?`
            : "Are you sure you want to restore this module?"
        }
        onConfirm={async () => {
          if (pendingRestore) {
            await bulkRestore.mutateAsync(pendingRestore);
            table.clearSelection();
          }
          setPendingRestore(null);
        }}
      />
    </div>
  );
};

export default ModuleList;
