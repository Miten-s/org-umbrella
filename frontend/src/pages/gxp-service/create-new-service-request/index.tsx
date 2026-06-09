import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useGlobalContext } from "@/context";
import { useModal } from "@/hooks/useModal";
import { useServerPagination } from "@/hooks/useServerPagination";
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
  bulkDeleteServiceRequests,
  createServiceRequest,
  getApplications,
  getServiceRequestById,
  getServiceRequests,
  updateServiceRequest
} from "@/services/gxp.service";
import { ServiceRequestFormOutput } from "@/lib/schema";
import { ServiceRequest } from "@/types/gxp-service.types";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateServiceRequestModal from "./CreateServiceRequestModal";

type Lookup = Record<string, string>;
type ServiceRequestModalMode = "create" | "edit" | "view";

const ensureArray = (value: any) =>
  Array.isArray(value)
    ? value
    : value?.data && Array.isArray(value.data)
      ? value.data
      : [];

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "SR";

const normalizeServiceRequest = (request: any): ServiceRequest => {
  const rawRequestTypes = request?.requestTypes;
  const normalizedApplication =
    request?.application && typeof request.application === "object"
      ? {
          ...request.application,
          applicationServiceRequestTypes:
            request.application.applicationServiceRequestTypes ??
            (Array.isArray(rawRequestTypes)
              ? rawRequestTypes
              : rawRequestTypes
                ? [rawRequestTypes]
                : [])
        }
      : (request?.application ?? "");

  return {
    _id: request?._id ?? "",
    serviceRequestId: request?.serviceRequestId ?? "",
    priority: request?.priority ?? "Medium",
    application: normalizedApplication,
    esignCheck: request?.esignCheck ?? "No",
    trainingDone: request?.trainingDone ?? true,
    description: request?.description ?? "",
    shortDescription: request?.shortDescription ?? "",
    requestType: request?.requestType ?? "Applications",
    applicationEnvironment:
      request?.environment ?? request?.applicationEnvironment ?? "",
    assignmentGroup: request?.assignmentGroup ?? request?.group ?? "",
    groupLocation: request?.location ?? request?.groupLocation ?? "",
    applicationWorkflow:
      request?.applicationWorkflow ?? request?.workflow ?? "",
    applicationModules: request?.applicationModules ?? request?.modules ?? [],
    applicationServiceRequestTypes: (() => {
      const serviceValue =
        request?.applicationServiceRequestTypes ??
        request?.requestTypes ??
        request?.requestType;
      if (Array.isArray(serviceValue)) {
        if (!serviceValue.length) return "";
        const first = serviceValue[0];
        if (typeof first === "string") return first;
        return first?._id ?? first?.service ?? "";
      }
      if (typeof serviceValue === "string") return serviceValue;
      return serviceValue?._id ?? serviceValue?.service ?? "";
    })(),
    requestTypes: rawRequestTypes,
    applicationRoles: request?.roles ?? request?.applicationRoles ?? [],
    notes: Array.isArray(request?.notes)
      ? request.notes.join("\n")
      : (request?.notes ?? ""),
    status: request?.status ?? "New",
    comments: request?.comments ?? [],
    attachments: request?.attachments ?? [],
    createdBy: request?.createdBy,
    createdAt: request?.createdAt,
    updatedAt: request?.updatedAt
  };
};

const nameLookup = (
  items: any[],
  nameKey: string,
  valueKey: string = "_id"
): Lookup =>
  items.reduce((acc: Lookup, item: any) => {
    const value = item?.[valueKey];
    const label = item?.[nameKey] ?? item?.name ?? value;
    if (value) acc[String(value)] = String(label);
    return acc;
  }, {});

const formatValue = (
  value: string | { _id?: string; [key: string]: any } | null | undefined,
  lookup: Lookup,
  nameKey?: string
) => {
  if (!value) return "-";
  if (typeof value === "string") return lookup[value] ?? value;
  const name = nameKey ? value?.[nameKey] : undefined;
  const id = value?._id;
  if (name) return name;
  if (id) return lookup[id] ?? id;
  return "-";
};

const copyServiceRequestsToClipboard = async (
  rows: ServiceRequest[],
  applicationLookup: Lookup
) => {
  if (!rows.length) {
    return;
  }

  const content = [
    "Service Request\tShort Description\tApplication\tPriority\tStatus",
    ...rows.map((request) =>
      [
        request.serviceRequestId ?? "",
        request.shortDescription ?? "",
        formatValue(request.application, applicationLookup, "applicationName"),
        request.priority ?? "",
        request.status ?? ""
      ].join("\t")
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
        ? `${rows.length} service requests copied to clipboard.`
        : "Service request copied to clipboard.",
      "success"
    );
  } catch (error) {
    console.error("Error copying service requests:", error);
    toast("Failed to copy service request details. Please try again.", "error");
  }
};

const GXPCreateNewServiceRequestPage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const paginatedServiceRequests = useServerPagination<ServiceRequest>({
    dataKeys: ["serviceRequests", "requests", "data"],
    dependencies: [reFetch],
    errorMessage: "Failed to load service requests. Please try again.",
    fetchPage: getServiceRequests,
    mapItems: (items) => items.map(normalizeServiceRequest)
  });
  const serviceRequests = paginatedServiceRequests.rows;
  const [applications, setApplications] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(
    null
  );
  const [requestModalMode, setRequestModalMode] =
    useState<ServiceRequestModalMode>("create");
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [pendingDeleteRequests, setPendingDeleteRequests] = useState<
    ServiceRequest[]
  >([]);

  const applicationLookup = useMemo(
    () => nameLookup(applications, "applicationName", "_id"),
    [applications]
  );

  const handleCloseModal = () => {
    closeModal();
    setActiveRequest(null);
    setRequestModalMode("create");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apps = await getApplications(false, { limit: 100 });
        setApplications(ensureArray(apps));
      } catch (error) {
        console.error("Error fetching service request references:", error);
      }
    };

    void fetchData();
  }, [reFetch]);

  const handleOpenRequestModal = useCallback(
    async (requestId: string, mode: ServiceRequestModalMode) => {
      setIsLoadingActive(true);
      try {
        const full = await getServiceRequestById(requestId);
        setActiveRequest(normalizeServiceRequest(full));
        setRequestModalMode(mode);
        openModal();
      } catch (error) {
        console.error("Failed to load service request details", error);
        toast(
          "Failed to load service request details. Please try again.",
          "error"
        );
      } finally {
        setIsLoadingActive(false);
      }
    },
    [openModal]
  );

  const toServiceRequestPayload = (
    data: ServiceRequestFormOutput,
    existingAttachmentIds: string[]
  ) => {
    const selectedServiceType =
      data.applicationServiceRequestTypes?.trim() || "";

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
      status: activeRequest ? data.status : "New",
      comments: data.comments || [],
      attachments: existingAttachmentIds
    };
  };

  const handleSave = async (
    data: ServiceRequestFormOutput,
    newAttachments: File[],
    existingAttachmentIds: string[]
  ) => {
    try {
      const payload = toServiceRequestPayload(data, existingAttachmentIds);
      if (activeRequest) {
        await updateServiceRequest(activeRequest._id, payload, newAttachments);
      } else {
        await createServiceRequest(payload, newAttachments);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Failed to save service request", error);
      toast("Failed to save service request. Please try again.", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteRequests.length) {
      return;
    }

    try {
      await bulkDeleteServiceRequests(
        pendingDeleteRequests.map((request) => request._id),
        { silent: true }
      );
      toast(
        pendingDeleteRequests.length > 1
          ? `${pendingDeleteRequests.length} service requests deleted successfully.`
          : "Service request deleted successfully.",
        "success"
      );

      setPendingDeleteRequests([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting service requests:", error);
      toast(
        "Failed to delete selected service requests. Please try again.",
        "error"
      );
    }
  };

  const toolbarActions = useMemo<AppDataTableToolbarAction<ServiceRequest>[]>(
    () => [
      {
        key: "create-service-request",
        label: t("create", { entity: t("serviceRequests") }),
        className: "whitespace-nowrap",
        disabled: isLoadingActive,
        icon: PlusIcon,
        onClick: () => {
          setActiveRequest(null);
          setRequestModalMode("create");
          openModal();
        },
        permission: GXP_PERMISSIONS.CREATE_SERVICE_REQUEST,
        variant: "primary"
      }
    ],
    [isLoadingActive, openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<ServiceRequest>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1
            ? "Copy service requests"
            : "Copy service request",
        icon: CopyIcon,
        variant: "outline",
        onClick: (selectedRows) =>
          copyServiceRequestsToClipboard(selectedRows, applicationLookup)
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1
            ? "Delete service requests"
            : "Delete service request",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_SERVICE_REQUEST,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteRequests(selectedRows)
      }
    ],
    [applicationLookup]
  );

  const rowActions = useMemo<AppDataTableRowAction<ServiceRequest>[]>(
    () => [
      {
        key: "view",
        label: "View service request",
        tooltip: "View service request",
        disabled: isLoadingActive,
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_SERVICE_REQUEST,
        onClick: (request) => handleOpenRequestModal(request._id, "view")
      },
      {
        key: "edit",
        label: "Edit service request",
        tooltip: "Edit service request",
        disabled: isLoadingActive,
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_SERVICE_REQUEST,
        onClick: (request) => handleOpenRequestModal(request._id, "edit")
      },
      {
        key: "copy",
        label: "Copy service request",
        tooltip: "Copy service request",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (request) =>
          copyServiceRequestsToClipboard([request], applicationLookup)
      },
      {
        key: "delete",
        label: "Delete service request",
        tooltip: "Delete service request",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_SERVICE_REQUEST,
        tone: "danger",
        onClick: (request) => setPendingDeleteRequests([request])
      }
    ],
    [applicationLookup, handleOpenRequestModal, isLoadingActive]
  );

  const columnDefs = useMemo<ColDef<ServiceRequest>[]>(
    () => [
      {
        field: "serviceRequestId",
        flex: 0.9,
        headerName: t("serviceRequestId"),
        minWidth: 220,
        cellRenderer: (params: ICellRendererParams<ServiceRequest>) => {
          const data = params.data;
          if (!data) return null;

          const identity =
            data.serviceRequestId || data.shortDescription || "Request";

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(identity)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.serviceRequestId || "-"}
              </div>
            </div>
          );
        }
      },
      {
        field: "shortDescription",
        flex: 1.3,
        headerName: t("shortDescription"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<ServiceRequest>) => (
          <div className="line-clamp-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.data?.shortDescription || "-"}
          </div>
        )
      },
      {
        field: "application",
        flex: 1,
        headerName: t("application"),
        minWidth: 220,
        valueGetter: ({ data }) =>
          formatValue(data?.application, applicationLookup, "applicationName"),
        cellRenderer: (params: ICellRendererParams<ServiceRequest>) => (
          <div className="line-clamp-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {formatValue(
              params.data?.application,
              applicationLookup,
              "applicationName"
            )}
          </div>
        )
      },
      {
        field: "priority",
        flex: 0,
        headerName: t("priority"),
        minWidth: 140,
        maxWidth: 160,
        cellRenderer: (params: ICellRendererParams<ServiceRequest>) => (
          <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.data?.priority || "-"}
          </div>
        )
      },
      {
        field: "status",
        flex: 0,
        headerName: t("status"),
        minWidth: 170,
        maxWidth: 200,
        cellRenderer: (params: ICellRendererParams<ServiceRequest>) => (
          <div className="py-1.5">
            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {params.data?.status || "-"}
            </span>
          </div>
        )
      }
    ],
    [applicationLookup, t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<ServiceRequest>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No service requests found"
          enableSelection
          errorMessage={paginatedServiceRequests.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(request) => request._id}
          headerHeight={46}
          loading={paginatedServiceRequests.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={serviceRequests}
          rowHeight={64}
          searchAccessor={(request) =>
            [
              request.serviceRequestId,
              request.shortDescription,
              formatValue(
                request.application,
                applicationLookup,
                "applicationName"
              ),
              request.priority,
              request.status
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search service requests..."
          tableName={t("gxpCreateNewServiceRequest")}
          {...paginatedServiceRequests.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[70rem] max-h-[45rem] m-4 overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateServiceRequestModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeRequest || undefined}
          mode={requestModalMode}
          optionSets={{
            applications
          }}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteRequests.length > 0}
        onClose={() => setPendingDeleteRequests([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteRequests.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteRequests.length} service requests?`
              : `${t("deleteEntityPrompt", {
                  entityName:
                    pendingDeleteRequests[0]?.serviceRequestId ||
                    pendingDeleteRequests[0]?.shortDescription
                })} ?`}
          </div>

          {pendingDeleteRequests.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteRequests.slice(0, 5).map((request) => (
                <div key={request._id} className="truncate py-0.5">
                  {request.serviceRequestId || request.shortDescription}
                </div>
              ))}
              {pendingDeleteRequests.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteRequests.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteRequests([])}
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

export default GXPCreateNewServiceRequestPage;
