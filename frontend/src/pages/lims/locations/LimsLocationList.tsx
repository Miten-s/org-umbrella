import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { toast } from "@/lib/toast";
import { idsSelection } from "@/lib/query/listTypes";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsLocationById, fetchLimsLocationList } from "./LimsLocation.api";
import { getLimsLocationColumns } from "./LimsLocation.columns";
import {
  limsLocationKeys,
  useBulkCloneLimsLocation,
  useBulkCopyLimsLocation,
  useBulkDeleteLimsLocation,
  useBulkUpdateLimsLocation,
  useCreateLimsLocation,
  useLimsLocationAudit,
  useRestoreLimsLocation,
  useUpdateLimsLocation,
  useLimsLocationById
} from "./LimsLocation.queries";
import LimsLocationForm, {
  type LimsLocationFormMode
} from "./LimsLocationForm";
import type { LimsLocation, LimsLocationPayload } from "./LimsLocation.types";

/** LIMS Storage Locations — reference module, built to STANDARDS.md/MIGRATION.md §5, plus
 * the GxP compliance the LIMS spec requires: mandatory change reason, soft delete, audit trail. */
const LimsLocationList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsLocationFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  // Change reason + restore + audit, shared across every LIMS module.
  const compliance = useLimsCompliance<LimsLocation, LimsLocationPayload>();
  const auditQuery = useLimsLocationAudit(compliance.auditRow?.id);
  const detailQuery = useLimsLocationById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  // MIGRATION.md §3.1-E: the bespoke list flag lives in the query key so
  // flipping it refetches, and is passed through a fetchList closure.
  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsLocationList>[1],
      signal?: AbortSignal
    ) => fetchLimsLocationList(includeRemoved, params, signal),
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
  const bulkCopy = useBulkCopyLimsLocation();
  const bulkDelete = useBulkDeleteLimsLocation();
  const bulkUpdate = useBulkUpdateLimsLocation();
  const restoreLocation = useRestoreLimsLocation();

  const busy =
    createLocation.isPending ||
    updateLocation.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restoreLocation.isPending;

  const columnDefs = useMemo(() => getLimsLocationColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsLocationFormMode, location: LimsLocation | null) => {
      setFormMode(mode);
      setActiveId(location?.id ?? null);
      openModal();
    },
    [openModal]
  );

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
    setActiveId(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: LimsLocationPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (updates: { id: string; payload: LimsLocationPayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  /** Create writes straight away; edit collects a change reason first. */
  const handleSave = async (payload: LimsLocationPayload, files: File[]) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload, files);
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
    setActiveId(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("view", { entity: t("limsLocations") }),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_LOCATION,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("viewBulkFilterUnsupported"), "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: (count) =>
          count > 1 ? "Copy storage locations" : "Copy storage location",
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_LOCATION,
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
        label: () => t("edit"),
        icon: PencilIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.UPDATE_LOCATION,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          openEdit(selection.ids);
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
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
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
        onClick: (location) =>
          openCopy([location.id])
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
    [compliance, openCopy, openForm]
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
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsLocation, LimsLocationPayload>
            ids={copyIds}
            fetchById={fetchLimsLocationById}
            FormComponent={LimsLocationForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsLocation")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsLocation>
            ids={viewIds}
            fetchById={fetchLimsLocationById}
            FormComponent={LimsLocationForm}
            onClose={handleCloseForm}
            entityLabel={t("limsLocation")}
          />
        ) : editIds ? (
          <EditStepper<LimsLocation, LimsLocationPayload>
            ids={editIds}
            fetchById={fetchLimsLocationById}
            FormComponent={LimsLocationForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsLocation")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsLocationForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createLocation.isPending || updateLocation.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="storage location"
        entityLabelPlural="storage locations"
        getRecordLabel={(row) => row.locationId || row.locationName}
        updating={updateLocation.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreLocation.isPending}
        bulkUpdating={bulkUpdate.isPending}
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onUpdate={confirmUpdate}
        onBulkUpdate={async (reason) => {
          const pending = compliance.pendingBulkUpdate;
          if (pending) {
            await bulkUpdate.mutateAsync({ updates: pending.updates, changeReason: reason });
            table.clearSelection();
          }
          compliance.clearBulkUpdate();
        }}
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
            await restoreLocation.mutateAsync({
              id: pending.id,
              changeReason: reason
            });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsLocationList;
