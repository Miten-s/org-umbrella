import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TimeIcon, TrashBinIcon } from "@/public/icons";
import { fetchLimsLocationList } from "./LimsLocation.api";
import { getLimsLocationColumns } from "./LimsLocation.columns";
import {
  limsLocationKeys,
  useBulkCloneLimsLocation,
  useBulkDeleteLimsLocation,
  useCreateLimsLocation,
  useLimsLocationAudit,
  useRestoreLimsLocation,
  useUpdateLimsLocation
} from "./LimsLocation.queries";
import LimsLocationForm, { type LimsLocationFormMode } from "./LimsLocationForm";
import type { LimsLocation, LimsLocationPayload } from "./LimsLocation.types";

/**
 * LIMS Storage Locations — reference module for the LIMS area, built to
 * STANDARDS.md and the MIGRATION.md §5 definition of done.
 *
 * Beyond the GxP baseline it adds the GxP-compliance behaviour the LIMS spec
 * requires: a mandatory change reason on every edit/remove/restore, soft delete
 * with restore, and a per-record audit trail.
 */
const LimsLocationList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsLocation | null>(null);
  const [formMode, setFormMode] = useState<LimsLocationFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  // Change reason + restore + audit, shared across every LIMS module.
  const compliance = useLimsCompliance<LimsLocation, LimsLocationPayload>();
  const auditQuery = useLimsLocationAudit(compliance.auditRow?.id);

  // MIGRATION.md §3.1-E: the bespoke list flag lives in the query key so
  // flipping it refetches, and is passed through a fetchList closure.
  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsLocationList>[1], signal?: AbortSignal) =>
      fetchLimsLocationList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsLocation>({
    entity: "limsLocation",
    queryKey: [...limsLocationKeys.all, { includeRemoved }],
    fetchList
  });

  const createLocation = useCreateLimsLocation();
  const updateLocation = useUpdateLimsLocation();
  const bulkClone = useBulkCloneLimsLocation();
  const bulkDelete = useBulkDeleteLimsLocation();
  const restoreLocation = useRestoreLimsLocation();

  const busy =
    createLocation.isPending ||
    updateLocation.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restoreLocation.isPending;

  const columnDefs = useMemo(() => getLimsLocationColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsLocationFormMode, location: LimsLocation | null) => {
      setFormMode(mode);
      setActive(location);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  /** Create writes straight away; edit collects a change reason first. */
  const handleSave = async (payload: LimsLocationPayload, files: File[]) => {
    if (active) {
      compliance.requestUpdate(active.id, payload, files);
      closeModal();
      return;
    }
    await createLocation.mutateAsync({ payload, files });
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updateLocation.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason },
      files: pending.files
    });
    compliance.clearUpdate();
    setActive(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy storage locations" : "Copy storage location"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_LOCATION,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) =>
          count > 1 ? "Remove storage locations" : "Remove storage location",
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_LOCATION,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map((row) => row.locationName)
              : []
          )
      }
    ],
    [bulkClone, compliance, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsLocation>[]>(
    () => [
      {
        key: "view",
        label: "View storage location",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_LOCATION,
        onClick: (location) => openForm("view", location)
      },
      {
        key: "edit",
        label: "Edit storage location",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_LOCATION,
        onClick: (location) => openForm("edit", location)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_LOCATION,
        onClick: (location) => compliance.openAudit(location)
      },
      {
        key: "clone",
        label: "Copy storage location",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_LOCATION,
        onClick: (location) => bulkClone.mutate({ mode: "ids", ids: [location.id] })
      },
      {
        key: "restore",
        label: "Restore storage location",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_LOCATION,
        hidden: (location: LimsLocation) => !location.isRemoved,
        onClick: (location) => compliance.requestRestore(location)
      },
      {
        key: "delete",
        label: "Remove storage location",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_LOCATION,
        hidden: (location: LimsLocation) => Boolean(location.isRemoved),
        onClick: (location) =>
          compliance.requestDelete({ mode: "ids", ids: [location.id] }, 1, [
            location.locationName
          ])
      }
    ],
    [bulkClone, compliance, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsLocation>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsLocations")}
        searchPlaceholder="Search storage locations…"
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
            label: t("create", { entity: t("limsLocation") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_LOCATION,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoLocations") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
      >
        <LimsLocationForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createLocation.isPending || updateLocation.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="storage location"
        entityLabelPlural="storage locations"
        getRecordLabel={(row) => row.locationId || row.locationName}
        updating={updateLocation.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreLocation.isPending}
        auditEntries={auditQuery.data ?? []}
        auditLoading={auditQuery.isLoading}
        onUpdate={confirmUpdate}
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
            await restoreLocation.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsLocationList;
