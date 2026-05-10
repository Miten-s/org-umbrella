import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useServerPagination } from "@/hooks/useServerPagination";
import { useModal } from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import {
  CheckLineIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import {
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation
} from "@/services/admin.service";
import { Location as LocationObj } from "@/types/common.types";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateLocationModal from "./CreateLocationModal";

type LocationModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "L";

const copyLocationsToClipboard = async (rows: LocationObj[]) => {
  if (!rows.length) {
    return;
  }

  const content = [
    "Location\tDescription",
    ...rows.map(
      (location) => `${location.locationName}\t${location.description ?? ""}`
    )
  ].join("\n");

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
    } else if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } else {
      throw new Error("Clipboard unavailable");
    }

    toast(
      rows.length > 1
        ? `${rows.length} locations copied to clipboard.`
        : "Location copied to clipboard.",
      "success"
    );
  } catch (error) {
    console.error("Error copying locations:", error);
    toast("Failed to copy location details. Please try again.", "error");
  }
};

const Location = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  const [activeLocation, setActiveLocation] = useState<LocationObj | null>(
    null
  );
  const [locationModalMode, setLocationModalMode] =
    useState<LocationModalMode>("create");
  const [refresh, setRefresh] = useState(false);
  const [pendingDeleteLocations, setPendingDeleteLocations] = useState<
    LocationObj[]
  >([]);
  const paginatedLocations = useServerPagination<LocationObj>({
    dataKeys: ["locations"],
    dependencies: [refresh],
    errorMessage: "Failed to load locations. Please try again.",
    fetchPage: getLocations
  });
  const locations = paginatedLocations.rows;

  const handleCloseModal = () => {
    closeModal();
    setActiveLocation(null);
    setLocationModalMode("create");
  };

  const handleSave = async (data: Partial<LocationObj>) => {
    try {
      if (activeLocation) {
        await updateLocation(activeLocation._id, data);
      } else {
        await createLocation(data);
      }

      handleCloseModal();
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error("Error saving location:", error);
      toast("Failed to save location. Please try again.", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteLocations.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        pendingDeleteLocations.map((location) =>
          deleteLocation(location._id, { silent: true })
        )
      );
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successfulDeletes = pendingDeleteLocations.length - failedDeletes;

      if (successfulDeletes > 0 && failedDeletes === 0) {
        toast(
          successfulDeletes > 1
            ? `${successfulDeletes} locations deleted successfully.`
            : "Location deleted successfully.",
          "success"
        );
      } else if (successfulDeletes > 0) {
        toast(
          `${successfulDeletes} locations deleted, ${failedDeletes} failed.`,
          "error"
        );
      } else {
        toast(
          "Failed to delete selected locations. Please try again.",
          "error"
        );
      }

      setPendingDeleteLocations([]);
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error("Error deleting location:", error);
      toast("Failed to delete selected locations. Please try again.", "error");
    }
  };

  const toolbarActions = useMemo<AppDataTableToolbarAction<LocationObj>[]>(
    () => [
      {
        key: "create-location",
        label: t("create", { entity: t("location") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveLocation(null);
          setLocationModalMode("create");
          openModal();
        },
        permission: "CREATE:LOCATION",
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<LocationObj>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy locations" : "Copy location",
        icon: CopyIcon,
        variant: "outline",
        onClick: (selectedRows) => copyLocationsToClipboard(selectedRows)
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete locations" : "Delete location",
        icon: TrashBinIcon,
        permission: "DELETE:LOCATION",
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteLocations(selectedRows)
      }
    ],
    []
  );

  const rowActions = useMemo<AppDataTableRowAction<LocationObj>[]>(
    () => [
      {
        key: "view",
        label: "View location",
        tooltip: "View location",
        icon: EyeIcon,
        placement: "inline",
        permission: "VIEW:LOCATION",
        onClick: (location) => {
          setActiveLocation(location);
          setLocationModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit location",
        tooltip: "Edit location",
        icon: PencilIcon,
        placement: "inline",
        permission: "UPDATE:LOCATION",
        onClick: (location) => {
          setActiveLocation(location);
          setLocationModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy location",
        tooltip: "Copy location",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (location) => copyLocationsToClipboard([location])
      },
      {
        key: "delete",
        label: "Delete location",
        tooltip: "Delete location",
        icon: TrashBinIcon,
        placement: "menu",
        permission: "DELETE:LOCATION",
        tone: "danger",
        onClick: (location) => setPendingDeleteLocations([location])
      }
    ],
    [openModal]
  );

  const columnDefs = useMemo<ColDef<LocationObj>[]>(
    () => [
      {
        field: "locationName",
        flex: 1,
        headerName: t("locationName"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<LocationObj>) => {
          const data = params.data;

          if (!data) {
            return null;
          }

          const initials = getInitials(data.locationName);

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {initials}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.locationName}
              </div>
            </div>
          );
        }
      },
      {
        field: "description",
        flex: 1.2,
        headerName: t("description"),
        minWidth: 280,
        cellRenderer: (params: ICellRendererParams<LocationObj>) => (
          <div className="truncate py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.value || "-"}
          </div>
        )
      }
    ],
    [t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<LocationObj>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No locations found"
          enableSelection
          errorMessage={paginatedLocations.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(location) => location._id}
          headerHeight={46}
          loading={paginatedLocations.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={locations}
          rowHeight={64}
          searchAccessor={(location) =>
            [location.locationName, location.description]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search locations..."
          tableName={t("locationsGroups")}
          {...paginatedLocations.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto"
      >
        <CreateLocationModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeLocation || undefined}
          mode={locationModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteLocations.length > 0}
        onClose={() => setPendingDeleteLocations([])}
        className="m-4 min-h-[150px] max-w-[600px]"
        showCloseButton={false}
      >
           <div className="flex h-full flex-col justify-between p-5 dark:text-white">
          <div className="py-2">
            {pendingDeleteLocations.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteLocations.length} locations?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteLocations[0]?.locationName
                })} ?`}
          </div>

          {pendingDeleteLocations.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteLocations.slice(0, 5).map((location) => (
                <div key={location._id} className="truncate py-0.5">
                  {location.locationName}
                </div>
              ))}
              {pendingDeleteLocations.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteLocations.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteLocations([])}
              className="flex items-center px-4 py-2 text-white"
            >
              {t("cancel")}
            </Button>

            <Button
              startIcon={<CheckLineIcon className="h-4 w-4" />}
              onClick={() => void handleDeleteConfirmed()}
              className="flex items-center px-4 py-2"
            >
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Location;
