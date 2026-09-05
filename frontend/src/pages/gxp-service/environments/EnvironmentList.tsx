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
  environmentKeys,
  useBulkCloneEnvironment,
  useBulkCopyEnvironment,
  useBulkDeleteEnvironment,
  useBulkRestoreEnvironment,
  useBulkUpdateEnvironment,
  useCreateEnvironment,
  useToggleEnvironmentStatus,
  useUpdateEnvironment
} from "./Environment.queries";
import { fetchEnvironmentById, fetchEnvironmentList } from "./Environment.api";
import { getEnvironmentColumns } from "./Environment.columns";
import EnvironmentForm, { type EnvironmentFormMode } from "./EnvironmentForm";
import type { EnvironmentFormValues } from "./Environment.schema";
import type { Environment } from "./Environment.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/** Environment module (GXP) — migrated via MIGRATION.md checklist (Track A batch). */
const EnvironmentList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<Environment | null>(null);
  const [formMode, setFormMode] = useState<EnvironmentFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);
  // Set instead of active/formMode while the Copy/View/Edit review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BulkSelection | null>(null);
  const [restoreNames, setRestoreNames] = useState<string[]>([]);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  // includeDisabled is a supported backend filter param, surfaced as a toggle.
  // It is part of the query key so flipping it refetches (STANDARDS.md §6/§10).
  const table = useServerTable<Environment>({
    entity: "environment",
    queryKey: [...environmentKeys.all, { includeDisabled }],
    fetchList: useCallback(
      (params, signal) => fetchEnvironmentList(includeDisabled, params, signal),
      [includeDisabled]
    )
  });

  const createEnvironment = useCreateEnvironment();
  const updateEnvironment = useUpdateEnvironment();
  const bulkClone = useBulkCloneEnvironment();
  const bulkCopy = useBulkCopyEnvironment();
  const bulkDelete = useBulkDeleteEnvironment();
  const bulkUpdate = useBulkUpdateEnvironment();
  const bulkRestore = useBulkRestoreEnvironment();
  const toggleStatus = useToggleEnvironmentStatus();
  const busy =
    createEnvironment.isPending ||
    updateEnvironment.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    bulkRestore.isPending ||
    toggleStatus.isPending;

  // Stable across renders — the toggle's live pending state goes through
  // gridContext instead, so a status click doesn't give ag-grid a new
  // cellRenderer identity (which would force a destroy/recreate of the cell
  // and kill the Switch's transition — see Environment.columns.tsx).
  const columnDefs = useMemo(() => getEnvironmentColumns({ t }), [t]);

  const gridContext = useMemo(
    () => ({
      toggleDisabled: toggleStatus.isPending,
      togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
      onToggleStatus: (environment: Environment) => {
        if (toggleStatus.isPending) return;
        toggleStatus.mutate(environment);
      }
    }),
    [toggleStatus]
  );

  const openForm = (mode: EnvironmentFormMode, environment: Environment | null) => {
    setFormMode(mode);
    setActive(environment);
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

  const handleSave = async (values: EnvironmentFormValues) => {
    if (active) {
      await updateEnvironment.mutateAsync({ id: active.id, payload: values });
    } else {
      await createEnvironment.mutateAsync(values);
    }
    handleCloseForm();
  };

  const handleSaveCopies = async (payloads: EnvironmentFormValues[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = async (updates: { id: string; payload: EnvironmentFormValues }[]) => {
    await bulkUpdate.mutateAsync(updates);
    handleCloseForm();
    table.clearSelection();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (count) => (count > 1 ? "View environments" : "View environment"),
        icon: EyeIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.VIEW_ENVIRONMENT,
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
        label: (count) => (count > 1 ? "Copy environments" : "Copy environment"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_ENVIRONMENT,
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
        label: (count) => (count > 1 ? "Edit environments" : "Edit environment"),
        icon: PencilIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_ENVIRONMENT,
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
        label: (count) => (count > 1 ? "Restore environments" : "Restore environment"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_ENVIRONMENT,
        hidden: (rows) => !(rows as Environment[]).some((row) => row.status === "disabled"),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to restore.", "error");
            return;
          }
          setPendingRestore(selection);
          setRestoreNames(table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.environmentName));
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete environments" : "Delete environment"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_ENVIRONMENT,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.environmentName)
              : []
          );
        }
      }
    ],
    [bulkClone, openCopy, openEdit, openView, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<Environment>[]>(
    () => [
      {
        key: "view",
        label: "View environment",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_ENVIRONMENT,
        onClick: (environment) => openForm("view", environment)
      },
      {
        key: "edit",
        label: "Edit environment",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_ENVIRONMENT,
        onClick: (environment) => openForm("edit", environment)
      },
      {
        key: "clone",
        label: "Copy environment",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.CREATE_ENVIRONMENT,
        onClick: (environment) => openCopy([environment.id])
      },
      {
        key: "restore",
        label: "Restore environment",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.UPDATE_ENVIRONMENT,
        hidden: (environment) => environment.status !== "disabled",
        onClick: (environment) => {
          setPendingRestore({ mode: "ids", ids: [environment.id] });
          setRestoreNames([environment.environmentName]);
        }
      },
      {
        key: "delete",
        label: "Delete environment",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: GXP_PERMISSIONS.DELETE_ENVIRONMENT,
        onClick: (environment) => {
          setPendingDelete({ mode: "ids", ids: [environment.id] });
          setDeleteCount(1);
          setDeleteNames([environment.environmentName]);
        }
      }
    ],
    [openCopy, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Environment>
        table={table}
        columnDefs={columnDefs}
        gridContext={gridContext}
        tableName={t("gxpEnvironments")}
        searchPlaceholder="Search environments…"
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
            label: t("create", { entity: t("environment") }),
            icon: PlusIcon,
            variant: "primary",
            permission: GXP_PERMISSIONS.CREATE_ENVIRONMENT,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No environments found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<Environment, EnvironmentFormValues>
            ids={copyIds}
            fetchById={fetchEnvironmentById}
            FormComponent={EnvironmentForm}
            onSaveAll={handleSaveCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending}
            entityLabel={t("environment")}
          />
        ) : viewIds ? (
          <ViewStepper<Environment>
            ids={viewIds}
            fetchById={fetchEnvironmentById}
            FormComponent={EnvironmentForm}
            onClose={handleCloseForm}
            entityLabel={t("environment")}
          />
        ) : editIds ? (
          <EditStepper<Environment, EnvironmentFormValues>
            ids={editIds}
            fetchById={fetchEnvironmentById}
            FormComponent={EnvironmentForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("environment")}
          />
        ) : (
          <EnvironmentForm
            mode={formMode}
            initialData={active}
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createEnvironment.isPending || updateEnvironment.isPending}
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
            ? `Are you sure you want to delete these ${deleteCount} environments?`
            : "Are you sure you want to delete this environment?"
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
            ? `Are you sure you want to restore these ${restoreNames.length} environments?`
            : "Are you sure you want to restore this environment?"
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

export default EnvironmentList;
