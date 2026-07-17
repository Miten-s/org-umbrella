import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  locationKeys,
  useBulkCloneLocation,
  useBulkDeleteLocation,
  useCreateLocation,
  useUpdateLocation
} from "./Location.queries";
import { fetchLocationList } from "./Location.api";
import { getLocationColumns } from "./Location.columns";
import LocationForm, { type LocationFormMode } from "./LocationForm";
import type { LocationFormValues } from "./Location.schema";
import type { Location } from "./Location.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/** Location module — migrated via MIGRATION.md checklist (Track A batch). */
const LocationList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<Location | null>(null);
  const [formMode, setFormMode] = useState<LocationFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);

  const table = useServerTable<Location>({
    entity: "location",
    queryKey: locationKeys.all,
    fetchList: fetchLocationList
  });

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const bulkClone = useBulkCloneLocation();
  const bulkDelete = useBulkDeleteLocation();
  const busy =
    createLocation.isPending ||
    updateLocation.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending;

  const columnDefs = useMemo(() => getLocationColumns({ t }), [t]);

  const openForm = (mode: LocationFormMode, location: Location | null) => {
    setFormMode(mode);
    setActive(location);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (values: LocationFormValues) => {
    if (active) {
      await updateLocation.mutateAsync({ id: active.id, payload: values });
    } else {
      await createLocation.mutateAsync(values);
    }
    handleCloseForm();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy locations" : "Copy location"),
        icon: CopyIcon,
        variant: "outline",
        permission: "CREATE:LOCATION",
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete locations" : "Delete location"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: "DELETE:LOCATION",
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.locationName)
              : []
          );
        }
      }
    ],
    [bulkClone, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<Location>[]>(
    () => [
      {
        key: "view",
        label: "View location",
        icon: EyeIcon,
        placement: "inline",
        permission: "VIEW:LOCATION",
        onClick: (location) => openForm("view", location)
      },
      {
        key: "edit",
        label: "Edit location",
        icon: PencilIcon,
        placement: "inline",
        permission: "UPDATE:LOCATION",
        onClick: (location) => openForm("edit", location)
      },
      {
        key: "clone",
        label: "Copy location",
        icon: CopyIcon,
        placement: "menu",
        permission: "CREATE:LOCATION",
        onClick: (location) => bulkClone.mutate({ mode: "ids", ids: [location.id] })
      },
      {
        key: "delete",
        label: "Delete location",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: "DELETE:LOCATION",
        onClick: (location) => {
          setPendingDelete({ mode: "ids", ids: [location.id] });
          setDeleteCount(1);
          setDeleteNames([location.locationName]);
        }
      }
    ],
    [bulkClone]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Location>
        table={table}
        columnDefs={columnDefs}
        tableName={t("locations")}
        searchPlaceholder="Search locations…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("location") }),
            icon: PlusIcon,
            variant: "primary",
            permission: "CREATE:LOCATION",
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No locations found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LocationForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createLocation.isPending || updateLocation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={
          deleteCount > 1
            ? `Are you sure you want to delete these ${deleteCount} locations?`
            : "Are you sure you want to delete this location?"
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

export default LocationList;
