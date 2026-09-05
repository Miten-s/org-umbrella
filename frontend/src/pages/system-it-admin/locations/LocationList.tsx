import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  locationKeys,
  useBulkCloneLocation,
  useBulkCopyLocation,
  useBulkDeleteLocation,
  useBulkUpdateLocation,
  useCreateLocation,
  useUpdateLocation
} from "./Location.queries";
import { fetchLocationById, fetchLocationList } from "./Location.api";
import { getLocationColumns } from "./Location.columns";
import LocationForm, { type LocationFormMode } from "./LocationForm";
import type { LocationFormValues } from "./Location.schema";
import type { Location } from "./Location.types";
import type { BulkSelection } from "@/lib/query/listTypes";
import { idsSelection } from "@/lib/query/listTypes";

/** Location module — migrated via MIGRATION.md checklist (Track A batch). */
const LocationList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<Location | null>(null);
  const [formMode, setFormMode] = useState<LocationFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);
  // Set instead of active/formMode while the multi-record Copy/View/Edit steppers are open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const table = useServerTable<Location>({
    entity: "location",
    queryKey: locationKeys.all,
    fetchList: fetchLocationList
  });

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const bulkClone = useBulkCloneLocation();
  const bulkCopy = useBulkCopyLocation();
  const bulkDelete = useBulkDeleteLocation();
  const bulkUpdate = useBulkUpdateLocation();
  const busy =
    createLocation.isPending ||
    updateLocation.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending;

  const columnDefs = useMemo(() => getLocationColumns({ t }), [t]);

  const openForm = (mode: LocationFormMode, location: Location | null) => {
    setFormMode(mode);
    setActive(location);
    openModal();
  };

  const openCopy = (ids: string[]) => {
    setCopyIds(ids);
    openModal();
  };

  const openView = (ids: string[]) => {
    setViewIds(ids);
    openModal();
  };

  const openEdit = (ids: string[]) => {
    setEditIds(ids);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSave = async (values: LocationFormValues) => {
    if (active) {
      await updateLocation.mutateAsync({ id: active.id, payload: values });
    } else {
      await createLocation.mutateAsync(values);
    }
    handleCloseForm();
  };

  const handleSaveCopies = async (payloads: LocationFormValues[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = async (updates: { id: string; payload: LocationFormValues }[]) => {
    await bulkUpdate.mutateAsync(updates);
    handleCloseForm();
    table.clearSelection();
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (count) => (count > 1 ? "View locations" : "View location"),
        icon: EyeIcon,
        variant: "outline",
        permission: "VIEW:LOCATION",
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select checkboxes to view multiple records.", "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy locations" : "Copy location"),
        icon: CopyIcon,
        variant: "outline",
        permission: "CREATE:LOCATION",
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
        label: (count) => (count > 1 ? "Edit locations" : "Edit location"),
        icon: PencilIcon,
        variant: "outline",
        permission: "UPDATE:LOCATION",
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select checkboxes to edit multiple records.", "error");
            return;
          }
          openEdit(selection.ids);
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
              ? table.getCachedRows(selection.ids).map((r) => r.locationName)
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
        onClick: (location) => openCopy([location.id])
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
    []
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Location>
        table={table}
        columnDefs={columnDefs}
        tableName={t("locationsGroups")}
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
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
      >
        {copyIds ? (
          <CopyStepper<Location, LocationFormValues>
            ids={copyIds}
            fetchById={fetchLocationById}
            FormComponent={LocationForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("location")}
          />
        ) : viewIds ? (
          <ViewStepper<Location>
            ids={viewIds}
            fetchById={fetchLocationById}
            FormComponent={LocationForm}
            onClose={handleCloseForm}
            entityLabel={t("location")}
          />
        ) : editIds ? (
          <EditStepper<Location, LocationFormValues>
            ids={editIds}
            fetchById={fetchLocationById}
            FormComponent={LocationForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("location")}
          />
        ) : (
          <LocationForm
            mode={formMode}
            initialData={active}
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createLocation.isPending || updateLocation.isPending}
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
