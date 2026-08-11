import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  environmentKeys,
  useBulkCloneEnvironment,
  useBulkDeleteEnvironment,
  useCreateEnvironment,
  useUpdateEnvironment
} from "./Environment.queries";
import { fetchEnvironmentList } from "./Environment.api";
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

  const table = useServerTable<Environment>({
    entity: "environment",
    queryKey: environmentKeys.all,
    fetchList: fetchEnvironmentList
  });

  const createEnvironment = useCreateEnvironment();
  const updateEnvironment = useUpdateEnvironment();
  const bulkClone = useBulkCloneEnvironment();
  const bulkDelete = useBulkDeleteEnvironment();
  const busy =
    createEnvironment.isPending ||
    updateEnvironment.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending;

  const columnDefs = useMemo(() => getEnvironmentColumns({ t }), [t]);

  const openForm = (mode: EnvironmentFormMode, environment: Environment | null) => {
    setFormMode(mode);
    setActive(environment);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (values: EnvironmentFormValues) => {
    if (active) {
      await updateEnvironment.mutateAsync({ id: active.id, payload: values });
    } else {
      await createEnvironment.mutateAsync(values);
    }
    handleCloseForm();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy environments" : "Copy environment"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_ENVIRONMENT,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
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
    [bulkClone, table]
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
        onClick: (environment) => bulkClone.mutate({ mode: "ids", ids: [environment.id] })
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
    [bulkClone, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Environment>
        table={table}
        columnDefs={columnDefs}
        tableName={t("gxpEnvironments")}
        searchPlaceholder="Search environments…"
        enableSelection
        fillAvailableHeight
        busy={busy}
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
      >
        <EnvironmentForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createEnvironment.isPending || updateEnvironment.isPending}
        />
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
    </div>
  );
};

export default EnvironmentList;
