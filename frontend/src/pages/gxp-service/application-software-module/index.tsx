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
import { useServerPagination } from "@/hooks/useServerPagination";
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
  createApplicationSoftware,
  deleteApplicationSoftware,
  disableApplicationSoftware,
  enableApplicationSoftware,
  getApplications,
  getApplicationSoftware,
  updateApplicationSoftware
} from "@/services/gxp.service";
import type {
  Application,
  ApplicationSoftwareModule
} from "@/types/gxp-service.types";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateApplicationSoftwareModuleModal from "./CreateApplicationSoftwareModuleModal";

type ApplicationSoftwareModalMode = "create" | "edit" | "view";

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { data?: unknown[] }).data)
  ) {
    return (value as { data: T[] }).data;
  }
  return [];
};

const getReferenceId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id?: string })._id ?? "");
  }
  return "";
};

const getReferenceName = (value: unknown, fallbackMap?: Map<string, string>): string => {
  if (!value) return "";
  if (typeof value === "object") {
    const record = value as { applicationName?: string; name?: string; _id?: string };
    if (record.applicationName) return record.applicationName;
    if (record.name) return record.name;
    if (record._id && fallbackMap?.has(record._id)) {
      return fallbackMap.get(record._id) ?? "";
    }
  }
  if (typeof value === "string") {
    return fallbackMap?.get(value) ?? "";
  }
  return "";
};

const getModuleApplicationId = (module?: Partial<ApplicationSoftwareModule> | null): string =>
  getReferenceId(module?.application) || "";

const normalizeModuleName = (value?: string) => (value ?? "").trim().toLowerCase();

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "M";

const copyModulesToClipboard = async (
  rows: ApplicationSoftwareModule[],
  applicationNameMap: Map<string, string>
) => {
  if (!rows.length) {
    return;
  }

  const content = [
    "Module\tIdentity\tApplication\tStatus",
    ...rows.map((module) =>
      [
        module.moduleName,
        module.moduleId ?? "",
        getReferenceName(module.application, applicationNameMap),
        module.status ?? ""
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
        ? `${rows.length} application modules copied to clipboard.`
        : "Application module copied to clipboard.",
      "success"
    );
  } catch (error) {
    console.error("Error copying application modules:", error);
    toast("Failed to copy module details. Please try again.", "error");
  }
};

const GXPApplicationSoftwareModulePage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [includeDisabled, setIncludeDisabled] = useState(false);
  const paginatedModules = useServerPagination<ApplicationSoftwareModule>({
    dataKeys: ["modules", "software", "data"],
    dependencies: [includeDisabled, reFetch],
    errorMessage: "Failed to load application modules. Please try again.",
    fetchPage: (params) => getApplicationSoftware(includeDisabled, params)
  });
  const modules = paginatedModules.rows;
  const setModules = paginatedModules.setRows;
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeModule, setActiveModule] = useState<ApplicationSoftwareModule | null>(null);
  const [moduleModalMode, setModuleModalMode] =
    useState<ApplicationSoftwareModalMode>("create");
  const [pendingDeleteModules, setPendingDeleteModules] = useState<
    ApplicationSoftwareModule[]
  >([]);

  const applicationNameMap = useMemo(
    () => new Map(applications.map((application) => [application._id, application.applicationName])),
    [applications]
  );

  const handleCloseModal = () => {
    closeModal();
    setActiveModule(null);
    setModuleModalMode("create");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const applicationsResponse = await getApplications(true, { limit: 100 });
        setApplications(ensureArray<Application>(applicationsResponse));
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };

    void fetchData();
  }, [reFetch]);

  const handleSave = async (data: Partial<ApplicationSoftwareModule>) => {
    const nextModuleName = normalizeModuleName(data.moduleName);
    const nextApplicationId = (data.application as string | undefined)?.trim() ?? "";

    const duplicateModule = nextApplicationId
      ? modules.find((module) => {
          if (activeModule?._id === module._id) return false;
          if (normalizeModuleName(module.moduleName) !== nextModuleName) return false;
          return getModuleApplicationId(module) === nextApplicationId;
        })
      : undefined;

    if (duplicateModule) {
      toast("This module name already exists for the selected application.", "error");
      return;
    }

    const payload = {
      ...data,
      application: nextApplicationId || undefined
    };

    try {
      if (activeModule) {
        await updateApplicationSoftware(activeModule._id, payload);
      } else {
        await createApplicationSoftware(payload);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving application module:", error);
      toast("Failed to save application module. Please try again.", "error");
    }
  };

  const handleStatusChange = async (module: ApplicationSoftwareModule) => {
    const nextStatus: ApplicationSoftwareModule["status"] =
      module.status === "enabled" ? "disabled" : "enabled";

    setModules((prev) =>
      prev.map((item) => (item._id === module._id ? { ...item, status: nextStatus } : item))
    );

    try {
      if (nextStatus === "enabled") {
        await enableApplicationSoftware(module._id);
      } else {
        await disableApplicationSoftware(module._id);
      }
    } catch (error) {
      console.error("Module status update failed:", error);
      setModules((prev) =>
        prev.map((item) => (item._id === module._id ? { ...item, status: module.status } : item))
      );
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteModules.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        pendingDeleteModules.map((module) =>
          deleteApplicationSoftware(module._id, { silent: true })
        )
      );
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successfulDeletes = pendingDeleteModules.length - failedDeletes;

      if (successfulDeletes > 0 && failedDeletes === 0) {
        toast(
          successfulDeletes > 1
            ? `${successfulDeletes} application modules deleted successfully.`
            : "Application module deleted successfully.",
          "success"
        );
      } else if (successfulDeletes > 0) {
        toast(
          `${successfulDeletes} application modules deleted, ${failedDeletes} failed.`,
          "error"
        );
      } else {
        toast("Failed to delete selected application modules. Please try again.", "error");
      }

      setPendingDeleteModules([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting application modules:", error);
      toast("Failed to delete selected application modules. Please try again.", "error");
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

  const toolbarActions =
    useMemo<AppDataTableToolbarAction<ApplicationSoftwareModule>[]>(
      () => [
        {
          key: "create-application-module",
          label: t("create", { entity: t("gxpAppModules") }),
          className: "whitespace-nowrap",
          icon: PlusIcon,
          onClick: () => {
            setActiveModule(null);
            setModuleModalMode("create");
            openModal();
          },
          permission: GXP_PERMISSIONS.CREATE_SOFTWARE_MODULES,
          variant: "primary"
        }
      ],
      [openModal, t]
    );

  const bulkActions = useMemo<AppDataTableBulkAction<ApplicationSoftwareModule>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1
            ? "Copy application modules"
            : "Copy application module",
        icon: CopyIcon,
        variant: "outline",
        onClick: (selectedRows) => copyModulesToClipboard(selectedRows, applicationNameMap)
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1
            ? "Delete application modules"
            : "Delete application module",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_SOFTWARE_MODULES,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteModules(selectedRows)
      }
    ],
    [applicationNameMap]
  );

  const rowActions = useMemo<AppDataTableRowAction<ApplicationSoftwareModule>[]>(
    () => [
      {
        key: "view",
        label: "View application module",
        tooltip: "View application module",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_SOFTWARE_MODULES,
        onClick: (module) => {
          setActiveModule(module);
          setModuleModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit application module",
        tooltip: "Edit application module",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_SOFTWARE_MODULES,
        onClick: (module) => {
          setActiveModule(module);
          setModuleModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy application module",
        tooltip: "Copy application module",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (module) => copyModulesToClipboard([module], applicationNameMap)
      },
      {
        key: "delete",
        label: "Delete application module",
        tooltip: "Delete application module",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_SOFTWARE_MODULES,
        tone: "danger",
        onClick: (module) => setPendingDeleteModules([module])
      }
    ],
    [applicationNameMap, openModal]
  );

  const columnDefs = useMemo<ColDef<ApplicationSoftwareModule>[]>(
    () => [
      {
        field: "moduleName",
        flex: 1,
        headerName: t("moduleName"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<ApplicationSoftwareModule>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(data.moduleName)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.moduleName}
              </div>
            </div>
          );
        }
      },
      {
        field: "moduleId",
        flex: 0,
        headerName: t("identity", { defaultValue: "Identity" }),
        minWidth: 160,
        maxWidth: 190,
        cellRenderer: (params: ICellRendererParams<ApplicationSoftwareModule>) => (
          <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.data?.moduleId || "-"}
          </div>
        )
      },
      {
        field: "application",
        flex: 1,
        headerName: t("application"),
        minWidth: 240,
        valueGetter: ({ data }) =>
          getReferenceName(data?.application, applicationNameMap) || "-",
        cellRenderer: (params: ICellRendererParams<ApplicationSoftwareModule>) => (
          <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {getReferenceName(params.data?.application, applicationNameMap) || "-"}
          </div>
        )
      },
      {
        field: "status",
        flex: 0,
        headerName: t("status"),
        minWidth: 170,
        maxWidth: 190,
        cellRenderer: (params: ICellRendererParams<ApplicationSoftwareModule>) => {
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
    [applicationNameMap, t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<ApplicationSoftwareModule>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No application modules found"
          enableSelection
          errorMessage={paginatedModules.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(module) => module._id}
          headerHeight={46}
          loading={paginatedModules.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={modules}
          rowHeight={64}
          searchAccessor={(module) =>
            [
              module.moduleName,
              module.moduleId,
              getReferenceName(module.application, applicationNameMap),
              module.status
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search application modules..."
          tableName={t("gxpApplicationSoftwareModule")}
          titleExtra={titleExtra}
          {...paginatedModules.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[700px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateApplicationSoftwareModuleModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={
            activeModule
              ? {
                  ...activeModule,
                  application: getModuleApplicationId(activeModule)
                }
              : undefined
          }
          applications={applications}
          mode={moduleModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteModules.length > 0}
        onClose={() => setPendingDeleteModules([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteModules.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteModules.length} application modules?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteModules[0]?.moduleName
                })} ?`}
          </div>

          {pendingDeleteModules.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteModules.slice(0, 5).map((module) => (
                <div key={module._id} className="truncate py-0.5">
                  {module.moduleName}
                </div>
              ))}
              {pendingDeleteModules.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteModules.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteModules([])}
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

export default GXPApplicationSoftwareModulePage;
