import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ServiceRequestFormOutput } from "@/lib/schema";
import {
  serviceRequestKeys,
  useBulkDeleteServiceRequest,
  useCreateServiceRequest,
  useServiceRequestDetail,
  useUpdateServiceRequest
} from "./GxpServiceRequest.queries";
import { fetchServiceRequestList } from "./GxpServiceRequest.api";
import { getServiceRequestColumns } from "./GxpServiceRequest.columns";
import GxpServiceRequestForm from "./GxpServiceRequestForm";
import type { GxpServiceRequest } from "./GxpServiceRequest.types";
import type { BulkSelection } from "@/lib/query/listTypes";

type Mode = "create" | "edit" | "view";

const GxpServiceRequestList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);

  const table = useServerTable<GxpServiceRequest>({
    entity: "gxpServiceRequest",
    queryKey: serviceRequestKeys.all,
    fetchList: fetchServiceRequestList
  });

  const detail = useServiceRequestDetail(activeId, isOpen && mode !== "create");
  const createSR = useCreateServiceRequest();
  const updateSR = useUpdateServiceRequest();
  const bulkDelete = useBulkDeleteServiceRequest();
  const busy = createSR.isPending || updateSR.isPending || bulkDelete.isPending;

  const columnDefs = useMemo(() => getServiceRequestColumns({ t }), [t]);

  const openForm = (m: Mode, id: string | null) => {
    setMode(m);
    setActiveId(id);
    openModal();
  };
  const handleClose = () => {
    closeModal();
    setActiveId(null);
    setMode("create");
  };

  // Payload shaping preserved verbatim from the legacy index.tsx#toServiceRequestPayload.
  const toPayload = (data: ServiceRequestFormOutput, existingAttachmentIds: string[]) => {
    const selectedServiceType = data.applicationServiceRequestTypes?.trim() || "";
    return {
      priority: data.priority,
      application: data.application,
      assignmentGroup: data.assignmentGroup || undefined,
      location: data.groupLocation || undefined,
      environment: data.applicationEnvironment || undefined,
      workflow: data.applicationWorkflow || undefined,
      modules: data.applicationModules || [],
      roles: data.applicationRoles || [],
      requestType: selectedServiceType || undefined,
      requestTypes: selectedServiceType || undefined,
      notes: data.notes ? [data.notes] : [],
      esignCheck: data.esignCheck,
      trainingDone: data.trainingDone,
      description: data.description,
      shortDescription: data.shortDescription,
      status: activeId ? data.status : "New",
      comments: data.comments || [],
      attachments: existingAttachmentIds
    };
  };

  const handleSave = async (
    data: ServiceRequestFormOutput,
    newFiles: File[],
    existingAttachmentIds: string[]
  ) => {
    const payload = toPayload(data, existingAttachmentIds);
    if (activeId) {
      await updateSR.mutateAsync({ id: activeId, payload, files: newFiles });
    } else {
      await createSR.mutateAsync({ payload, files: newFiles });
    }
    handleClose();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "delete",
        label: (c) => (c > 1 ? "Delete service requests" : "Delete service request"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_SOFTWARE,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(selection.mode === "ids" ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.serviceRequestId || "-") : []);
        }
      }
    ],
    [table]
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpServiceRequest>[]>(
    () => [
      { key: "view", label: "View service request", icon: EyeIcon, placement: "inline", permission: GXP_PERMISSIONS.VIEW_SOFTWARE, onClick: (r) => openForm("view", r.id) },
      { key: "edit", label: "Edit service request", icon: PencilIcon, placement: "inline", permission: GXP_PERMISSIONS.UPDATE_SOFTWARE, onClick: (r) => openForm("edit", r.id) },
      {
        key: "delete", label: "Delete service request", icon: TrashBinIcon, placement: "menu", tone: "danger", permission: GXP_PERMISSIONS.DELETE_SOFTWARE,
        onClick: (r) => { setPendingDelete({ mode: "ids", ids: [r.id] }); setDeleteCount(1); setDeleteNames([r.serviceRequestId || "-"]); }
      }
    ],
    [openForm]
  );

  // For edit/view, wait for a FRESH fetch before rendering the form — otherwise
  // React Query serves the previous (stale) cache for this id while it refetches,
  // flashing old values. isFetching covers both first load and background refetch.
  const showForm = mode === "create" || (!!detail.data && !detail.isFetching);

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<GxpServiceRequest>
        table={table}
        columnDefs={columnDefs}
        tableName={t("serviceRequests")}
        searchPlaceholder="Search service requests…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          { key: "create", label: t("gxpCreateNewServiceRequest"), icon: PlusIcon, variant: "primary", permission: GXP_PERMISSIONS.CREATE_SOFTWARE, onClick: () => openForm("create", null) }
        ]}
        emptyState={{ title: "No service requests found" }}
      />

      <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-h-[calc(100dvh-2rem)] max-w-[1000px] overflow-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        {showForm ? (
          <GxpServiceRequestForm
            mode={mode}
            initialData={mode === "create" ? null : ((detail.data as any) ?? null)}
            onClose={handleClose}
            onSubmit={handleSave}
            optionSets={{ applications: [] }}
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
        description={deleteCount > 1 ? `Are you sure you want to delete these ${deleteCount} service requests?` : "Are you sure you want to delete this service request?"}
        onConfirm={async () => {
          if (pendingDelete) { await bulkDelete.mutateAsync(pendingDelete); table.clearSelection(); }
          setPendingDelete(null);
        }}
      />
    </div>
  );
};

export default GxpServiceRequestList;
