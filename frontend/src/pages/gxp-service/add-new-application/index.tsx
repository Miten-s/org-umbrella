
import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import Switch from "@/components/common/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useGlobalContext } from "@/context";
import { useModal } from "@/hooks/useModal";
import { toast } from "@/lib/ToastProvider";
import {
  CheckLineIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import {
  createApplication,
  deleteApplication,
  disableApplication,
  duplicateApplication,
  enableApplication,
  getApplicationById,
  getApplicationGroups,
  getApplicationRoles,
  getApplications,
  getApplicationSoftware,
  getAssignmentGroups,
  getEnvironments,
  getServiceTypes,
  getSuppliers,
  getWorkflows,
  updateApplication
} from "@/services/gxp.service";
import { getDepartments, getLocations, getUsers } from "@/services/admin.service";
import CreateApplicationModal, { ApplicationPayload } from "./CreateApplicationModal";
import type {
  Application,
  ApplicationGroup,
  ApplicationRole,
  ApplicationServiceRequestType,
  ApplicationSoftwareModule,
  AssignmentGroup,
  Environment,
  Supplier,
  User,
  Workflow
} from "@/types/gxp-service.types";
import type { Department, Location } from "@/types/common.types";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Role = ApplicationRole;
type ApplicationModalMode = "create" | "edit" | "view";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (isRecord(value) && Array.isArray(value.data)) return value.data as T[];
  return [];
};

const extractList = <T,>(
  settled: PromiseSettledResult<unknown>,
  preferredKeys: string[] = []
): T[] => {
  if (!settled || settled.status !== "fulfilled") return [];

  const value = settled.value;

  if (Array.isArray(value)) return value as T[];
  if (!isRecord(value)) return [];
  if (Array.isArray(value.data)) return value.data as T[];

  for (const key of preferredKeys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }

  const firstArray = Object.values(value).find(Array.isArray);
  return Array.isArray(firstArray) ? (firstArray as T[]) : [];
};

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "A";

const getEntityLabel = (value: unknown, preferredKeys: string[] = []) => {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "-";

  for (const key of preferredKeys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  if (typeof value.name === "string" && value.name.trim()) {
    return value.name;
  }

  if (typeof value._id === "string" && value._id.trim()) {
    return value._id;
  }

  return "-";
};

const getApplicationIdentity = (application: Application) =>
  String((application as Application & { applicationId?: string }).applicationId ?? "").trim();

const duplicateApplications = async (
  rows: Application[],
  includeDisabled: boolean,
  refreshApplications: (applications: Application[]) => void,
  setReFetch: (value: boolean) => void,
  reFetch: boolean
) => {
  if (!rows.length) {
    return;
  }

  try {
    const results = await Promise.allSettled(
      rows.map((application) => duplicateApplication(application._id, { silent: true }))
    );
    const failedCopies = results.filter((result) => result.status === "rejected").length;
    const successfulCopies = rows.length - failedCopies;

    if (successfulCopies > 0 && failedCopies === 0) {
      toast(
        successfulCopies > 1
          ? `${successfulCopies} applications copied successfully.`
          : "Application copied successfully.",
        "success"
      );
    } else if (successfulCopies > 0) {
      toast(`${successfulCopies} applications copied, ${failedCopies} failed.`, "error");
    } else {
      toast("Failed to copy selected applications. Please try again.", "error");
    }

    if (successfulCopies > 0) {
      const refreshed = await getApplications(includeDisabled);
      refreshApplications(ensureArray<Application>(refreshed));
      setReFetch(!reFetch);
    }
  } catch (error) {
    console.error("Application copy failed:", error);
    toast("Failed to copy selected applications. Please try again.", "error");
  }
};

const GXPAddNewApplicationPage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);
  const [applicationModalMode, setApplicationModalMode] =
    useState<ApplicationModalMode>("create");
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [pendingDeleteApplications, setPendingDeleteApplications] = useState<Application[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [appModules, setAppModules] = useState<ApplicationSoftwareModule[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignmentGroups, setAssignmentGroups] = useState<AssignmentGroup[]>([]);
  const [applicationGroups, setApplicationGroups] = useState<ApplicationGroup[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [serviceRequestTypes, setServiceRequestTypes] = useState<ApplicationServiceRequestType[]>([]);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const handleCloseModal = () => {
    closeModal();
    setActiveApplication(null);
    setApplicationModalMode("create");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsTableLoading(true);
        setTableError(null);

        const applicationsResponse = await getApplications(includeDisabled);
        setApplications(ensureArray<Application>(applicationsResponse));

        const [environmentsResponse, locationsResponse] = await Promise.all([
          getEnvironments(),
          getLocations()
        ]);

        setEnvironments(ensureArray<Environment>(environmentsResponse));
        setLocations(ensureArray<Location>(locationsResponse?.locations));

        const settledResults = await Promise.allSettled([
          getApplicationSoftware(),
          getWorkflows(),
          getUsers(),
          getSuppliers(),
          getDepartments(),
          getAssignmentGroups(),
          getApplicationGroups(),
          getApplicationRoles(),
          getServiceTypes()
        ]);

        const [mods, workflowsResult, usersResult, suppliersResult, departmentsResult, assignmentGroupsResult, applicationGroupsResult, rolesResult, serviceTypesResult] =
          settledResults;

        setAppModules(
          extractList<ApplicationSoftwareModule>(mods, ["modules", "software", "data"])
        );
        setWorkflows(extractList<Workflow>(workflowsResult, ["workflows", "data"]));
        setUsers(extractList<User>(usersResult, ["users", "data"]));
        setSuppliers(extractList<Supplier>(suppliersResult, ["suppliers", "data"]));
        setDepartments(extractList<Department>(departmentsResult, ["departments", "data"]));
        setAssignmentGroups(
          extractList<AssignmentGroup>(assignmentGroupsResult, ["assignmentGroups", "data"])
        );
        setApplicationGroups(
          extractList<ApplicationGroup>(applicationGroupsResult, ["applicationGroups", "data"])
        );
        setRoles(extractList<Role>(rolesResult, ["applicationRoles", "roles", "data"]));
        setServiceRequestTypes(
          extractList<ApplicationServiceRequestType>(serviceTypesResult, [
            "service_types",
            "serviceTypes",
            "data"
          ])
        );
      } catch (error) {
        console.error("Error fetching applications:", error);
        setTableError("Failed to load applications. Please try again.");
      } finally {
        setIsTableLoading(false);
      }
    };

    void fetchData();
  }, [includeDisabled, reFetch]);

  const handleOpenApplicationModal = async (
    applicationId: string,
    mode: ApplicationModalMode
  ) => {
    setIsLoadingActive(true);

    try {
      const full = await getApplicationById(applicationId);
      setActiveApplication(full as Application);
      setApplicationModalMode(mode);
      openModal();
    } catch (error) {
      console.error("Failed to load application details", error);
      toast("Failed to load application details. Please try again.", "error");
    } finally {
      setIsLoadingActive(false);
    }
  };

  const handleSave = async (
    data: ApplicationPayload,
    newAttachments: File[],
    existingAttachments: string[]
  ) => {
    const payloadWithAttachments = {
      ...data,
      attachments: existingAttachments ?? []
    };

    try {
      if (activeApplication) {
        await updateApplication(activeApplication._id, payloadWithAttachments, newAttachments);
      } else {
        await createApplication(payloadWithAttachments, newAttachments);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving application:", error);
      toast("Failed to save application. Please try again.", "error");
    }
  };

  const handleStatusChange = async (application: Application) => {
    const nextStatus = application.status === "enabled" ? "disabled" : "enabled";

    setApplications((prev) =>
      prev.map((item) =>
        item._id === application._id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      if (nextStatus === "enabled") {
        await enableApplication(application._id);
      } else {
        await disableApplication(application._id);
      }
    } catch (error) {
      console.error("Application status update failed:", error);
      setApplications((prev) =>
        prev.map((item) =>
          item._id === application._id ? { ...item, status: application.status } : item
        )
      );
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteApplications.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        pendingDeleteApplications.map((application) =>
          deleteApplication(application._id, { silent: true })
        )
      );
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successfulDeletes = pendingDeleteApplications.length - failedDeletes;

      if (successfulDeletes > 0 && failedDeletes === 0) {
        toast(
          successfulDeletes > 1
            ? `${successfulDeletes} applications deleted successfully.`
            : "Application deleted successfully.",
          "success"
        );
      } else if (successfulDeletes > 0) {
        toast(
          `${successfulDeletes} applications deleted, ${failedDeletes} failed.`,
          "error"
        );
      } else {
        toast("Failed to delete selected applications. Please try again.", "error");
      }

      setPendingDeleteApplications([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting applications:", error);
      toast("Failed to delete selected applications. Please try again.", "error");
    }
  };

  const titleExtra = useMemo<ReactNode>(
    () => (
      <Switch
        label={t("includeDisabled")}
        checked={includeDisabled}
        onChange={() => setIncludeDisabled((prev) => !prev)}
      />
    ),
    [includeDisabled, t]
  );

  const toolbarActions = useMemo<AppDataTableToolbarAction<Application>[]>(
    () => [
      {
        key: "create-application",
        label: t("create", { entity: t("gxpApplications") }),
        className: "whitespace-nowrap",
        disabled: isLoadingActive,
        icon: PlusIcon,
        onClick: () => {
          setActiveApplication(null);
          setApplicationModalMode("create");
          openModal();
        },
        permission: GXP_PERMISSIONS.CREATE_SOFTWARE,
        variant: "primary"
      }
    ],
    [isLoadingActive, openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<Application>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy applications" : "Copy application",
        disabled: isLoadingActive,
        icon: CopyIcon,
        permission: GXP_PERMISSIONS.CREATE_SOFTWARE,
        variant: "outline",
        onClick: (selectedRows) =>
          duplicateApplications(
            selectedRows,
            includeDisabled,
            setApplications,
            setReFetch,
            reFetch
          )
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete applications" : "Delete application",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_SOFTWARE,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteApplications(selectedRows)
      }
    ],
    [includeDisabled, isLoadingActive, reFetch, setReFetch]
  );

  const rowActions = useMemo<AppDataTableRowAction<Application>[]>(
    () => [
      {
        key: "view",
        label: "View application",
        tooltip: "View application",
        disabled: isLoadingActive,
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_SOFTWARE,
        onClick: (application) =>
          handleOpenApplicationModal(application._id, "view")
      },
      {
        key: "edit",
        label: "Edit application",
        tooltip: "Edit application",
        disabled: isLoadingActive,
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_SOFTWARE,
        onClick: (application) =>
          handleOpenApplicationModal(application._id, "edit")
      },
      {
        key: "copy",
        label: "Copy application",
        tooltip: "Copy application",
        disabled: isLoadingActive,
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.CREATE_SOFTWARE,
        onClick: async (application) =>
          duplicateApplications(
            [application],
            includeDisabled,
            setApplications,
            setReFetch,
            reFetch
          )
      },
      {
        key: "delete",
        label: "Delete application",
        tooltip: "Delete application",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_SOFTWARE,
        tone: "danger",
        onClick: (application) => setPendingDeleteApplications([application])
      }
    ],
    [includeDisabled, isLoadingActive, reFetch]
  );

  const columnDefs = useMemo<ColDef<Application>[]>(
    () => [
      {
        field: "applicationName",
        flex: 1.1,
        headerName: t("applicationName"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<Application>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(data.applicationName)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.applicationName}
              </div>
            </div>
          );
        }
      },
      {
        colId: "applicationIdentity",
        flex: 0,
        headerName: t("identity", { defaultValue: "Identity" }),
        minWidth: 160,
        maxWidth: 190,
        valueGetter: ({ data }) => getApplicationIdentity(data as Application) || "-",
        cellRenderer: (params: ICellRendererParams<Application>) => (
          <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {getApplicationIdentity(params.data as Application) || "-"}
          </div>
        )
      },
      {
        field: "applicationType",
        flex: 0,
        headerName: t("applicationType"),
        minWidth: 160,
        maxWidth: 180,
        cellRenderer: (params: ICellRendererParams<Application>) => (
          <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.data?.applicationType || "-"}
          </div>
        )
      },
      {
        field: "applicationEnvironment",
        flex: 1,
        headerName: t("applicationEnvironment"),
        minWidth: 220,
        valueGetter: ({ data }) =>
          getEntityLabel(data?.applicationEnvironment, ["environmentName", "name"]),
        cellRenderer: (params: ICellRendererParams<Application>) => (
          <div className="line-clamp-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {getEntityLabel(params.data?.applicationEnvironment, ["environmentName", "name"])}
          </div>
        )
      },
      {
        field: "status",
        flex: 0,
        headerName: t("status"),
        minWidth: 170,
        maxWidth: 190,
        cellRenderer: (params: ICellRendererParams<Application>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="py-1.5">
              <Switch
                label={data.status === "enabled" ? t("enabled") : t("disabled")}
                checked={data.status === "enabled"}
                onChange={() => handleStatusChange(data)}
              />
            </div>
          );
        }
      }
    ],
    [t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<Application>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No applications found"
          enableSelection
          errorMessage={tableError}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(application) => application._id}
          headerHeight={46}
          loading={isTableLoading}
          maxInlineRowActions={2}
          pageSize={20}
          pageSizeOptions={[20, 50, 100]}
          rowActions={rowActions}
          rowData={applications}
          rowHeight={64}
          searchAccessor={(application) =>
            [
              application.applicationName,
              getApplicationIdentity(application),
              application.applicationType,
              getEntityLabel(application.applicationEnvironment, ["environmentName", "name"]),
              application.status
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search applications..."
          tableName={t("gxpApplications")}
          titleExtra={titleExtra}
          toolbarActions={toolbarActions}
          totalLabel={`${applications.length} total`}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[70rem] max-h-[45rem] overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateApplicationModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeApplication || undefined}
          mode={applicationModalMode}
          optionSets={{
            environments,
            locations,
            assignmentGroups,
            applicationGroups,
            appModules,
            workflows,
            users,
            suppliers,
            departments,
            roles,
            serviceRequestTypes
          }}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteApplications.length > 0}
        onClose={() => setPendingDeleteApplications([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteApplications.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteApplications.length} applications?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteApplications[0]?.applicationName
                })} ?`}
          </div>

          {pendingDeleteApplications.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteApplications.slice(0, 5).map((application) => (
                <div key={application._id} className="truncate py-0.5">
                  {application.applicationName}
                </div>
              ))}
              {pendingDeleteApplications.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteApplications.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteApplications([])}
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

export default GXPAddNewApplicationPage;
