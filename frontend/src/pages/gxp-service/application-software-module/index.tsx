import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useGlobalContext } from "@/context";
import { toast } from "@/lib/ToastProvider";
import Switch from "@/components/common/form/switch/Switch";

import CreateApplicationSoftwareModuleModal from "./CreateApplicationSoftwareModuleModal";

import {
  createApplicationSoftware,
  getApplicationSoftware,
  updateApplicationSoftware,
  deleteApplicationSoftware,
  enableApplicationSoftware,
  disableApplicationSoftware,
  getApplications,
} from "@/services/gxp.service";
import type { Application, ApplicationSoftwareModule } from "@/types/gxp-service.types";

const ensureArray = <T,>(val: unknown): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "object" && val !== null && Array.isArray((val as { data?: unknown[] }).data)) {
    return (val as { data: T[] }).data;
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
    if (record._id && fallbackMap?.has(record._id)) return fallbackMap.get(record._id) ?? "";
  }
  if (typeof value === "string") {
    return fallbackMap?.get(value) ?? "";
  }
  return "";
};

const getModuleApplicationId = (module?: Partial<ApplicationSoftwareModule> | null): string =>
  getReferenceId(module?.application)|| "";

const normalizeModuleName = (value?: string) => (value ?? "").trim().toLowerCase();

const GXPApplicationSoftwareModulePage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [modules, setModules] = useState<ApplicationSoftwareModule[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeModule, setActiveModule] = useState<ApplicationSoftwareModule | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<ApplicationSoftwareModule | null>(null);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  useEffect(() => {
    (async () => {
      const [modulesResponse, applicationsResponse] = await Promise.all([
        getApplicationSoftware(includeDisabled),
        getApplications(true),
      ]);
      setModules(ensureArray<ApplicationSoftwareModule>(modulesResponse));
      setApplications(ensureArray<Application>(applicationsResponse));
    })();
  }, [reFetch, includeDisabled]);

  const applicationNameMap = new Map(
    applications.map((application) => [application._id, application.applicationName])
  );

  const openEditModal = (module: ApplicationSoftwareModule) => {
    setActiveModule(module);
    openModal();
  };

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
      application: nextApplicationId || undefined,
    };

    if (activeModule) {
      const updated = await updateApplicationSoftware(activeModule._id, payload);
      setModules((prev) => prev.map((module) => (module._id === updated._id ? updated : module)));
    } else {
      const created = await createApplicationSoftware(payload);
      setModules((prev) => [created, ...prev]);
    }

    setActiveModule(null);
    setReFetch(!reFetch);
    closeModal();
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
      setModules((prev) =>
        prev.map((item) => (item._id === module._id ? { ...item, status: module.status } : item))
      );
      console.error("Module status update failed:", error);
    }
  };

  const confirmDelete = async () => {
    if (!moduleToDelete) return;
    await deleteApplicationSoftware(moduleToDelete._id);
    setModules((prev) => prev.filter((module) => module._id !== moduleToDelete._id));
    setModuleToDelete(null);
    setConfirmationModal(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpAppModules")}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              label={t("includeDisabled")}
              checked={includeDisabled}
              onChange={() => setIncludeDisabled((prev) => !prev)}
            />
          </div>
          <Button
            onClick={() => {
              setActiveModule(null);
              openModal();
            }}
          >
            {t("create", { entity: t("gxpAppModules") })}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {["moduleName", "moduleId", "application", "status", "actions"].map((key) => (
                <th
                  key={key}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {modules?.map((module) => (
              <tr key={module._id}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {module.moduleName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {module.moduleId || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {getReferenceName(module.application, applicationNameMap) || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Switch
                    label={module.status === "enabled" ? t("enabled") : t("disabled")}
                    checked={module.status === "enabled"}
                    onChange={() => handleStatusChange(module)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    onClick={() => openEditModal(module)}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    onClick={() => {
                      setModuleToDelete(module);
                      setConfirmationModal(true);
                    }}
                    variant="destructive"
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t("delete")}
                  </Button>
                </td>
              </tr>
            ))}

            {modules?.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                >
                  {t("noRecordsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateApplicationSoftwareModuleModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={
            activeModule
              ? {
                  ...activeModule,
                  application: getModuleApplicationId(activeModule),
                }
              : undefined
          }
          applications={applications}
        />
      </Modal>

      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {t("deleteEntityPrompt", { entityName: moduleToDelete?.moduleName })}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmationModal(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GXPApplicationSoftwareModulePage;
