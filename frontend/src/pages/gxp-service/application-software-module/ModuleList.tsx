import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
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
  useBulkDeleteModule,
  useCreateModule,
  useToggleModuleStatus,
  useUpdateModule
} from "./Module.queries";
import { fetchModuleList } from "./Module.api";
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
  const bulkDelete = useBulkDeleteModule();
  const toggleStatus = useToggleModuleStatus();
  const busy =
    createModule.isPending ||
    updateModule.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    toggleStatus.isPending;

  const columnDefs = useMemo(
    () =>
      getModuleColumns({
        t,
        toggleDisabled: toggleStatus.isPending,
        togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
        onToggleStatus: (module) => {
          if (toggleStatus.isPending) return;
          toggleStatus.mutate(module);
        }
      }),
    [t, toggleStatus]
  );

  const openForm = (mode: ModuleFormMode, module: ApplicationSoftwareModule | null) => {
    setFormMode(mode);
    setActive(module);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
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
        key: "clone",
        label: (count) => (count > 1 ? "Copy modules" : "Copy module"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_SOFTWARE_MODULES,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
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
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.moduleName)
              : []
          );
        }
      }
    ],
    [bulkClone, table]
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
        onClick: (module) => bulkClone.mutate({ mode: "ids", ids: [module.id] })
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
    [bulkClone]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<ApplicationSoftwareModule>
        table={table}
        columnDefs={columnDefs}
        tableName={t("applicationSoftwareModule")}
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
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <ModuleForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createModule.isPending || updateModule.isPending}
        />
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
    </div>
  );
};

export default ModuleList;
