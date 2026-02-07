
// src/pages/gxp/Applications.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useGlobalContext } from "@/context";

import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  enableApplication,
  disableApplication,
  // Option datasets (rename if your service names differ)
  getEnvironments,
  getWorkflows,
  getSuppliers,
  getApplicationSoftware,
  getApplicationById,
  getApplicationGroups,
  getApplicationRoles,
  getServiceTypes,
} from "@/services/gxp.service";
import CreateApplicationModal, { ApplicationPayload } from "./CreateApplicationModal";
import Switch from "@/components/common/form/switch/Switch";
import { getDepartments, getUsers, getLocations } from "@/services/admin.service";
import type {
  Application,
  ApplicationRole,
  ApplicationSoftwareModule,
  ApplicationGroup,
  ApplicationServiceRequestType,
  Environment,
  Supplier,
  User,
  Workflow,
} from "@/types/gxp-service.types";
import type { Department, Location } from "@/types/common.types";
type Role = ApplicationRole;

const GXPAddNewApplicationPage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);

  // Option lists
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [appModules, setAppModules] = useState<ApplicationSoftwareModule[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applicationGroups, setApplicationGroups] = useState<ApplicationGroup[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [serviceRequestTypes, setServiceRequestTypes] = useState<ApplicationServiceRequestType[]>(
    []
  );
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const isRecord = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && val !== null;

  const ensureArray = <T,>(val: unknown): T[] => {
    if (Array.isArray(val)) return val as T[];
    if (isRecord(val) && Array.isArray(val.data)) return val.data as T[];
    return [];
  };

  // helper: pick the first array from a settled result by preferred keys, then fallback
  const extractList = <T,>(
    settled: PromiseSettledResult<unknown>,
    preferredKeys: string[] = []
  ): T[] => {
    if (!settled || settled.status !== "fulfilled") return [];

    const v = settled.value;

    // 1) direct array
    if (Array.isArray(v)) return v as T[];

    // 2) common keys
    if (!isRecord(v)) return [];
    if (Array.isArray(v.data)) return v.data as T[];
    for (const k of preferredKeys) {
      const candidate = v[k];
      if (Array.isArray(candidate)) return candidate as T[];
    }

    // 3) fallback: first array found among values
    const firstArray = Object.values(v).find(Array.isArray);
    return Array.isArray(firstArray) ? (firstArray as T[]) : [];
  };

  useEffect(() => {
    (async () => {
      const applications = await getApplications(includeDisabled);
      setApplications(ensureArray<Application>(applications));
      const [envs, locs] = await Promise.all([getEnvironments(), getLocations()]);
      setEnvironments(ensureArray<Environment>(envs));
      setLocations(ensureArray<Location>(locs?.locations));
      // load option sets (any shape tolerated)
      const [mods, wfs, us, sups, deps, ags, rs, srts] = await Promise.allSettled([
        getApplicationSoftware(),
        getWorkflows(),
        getUsers(),
        getSuppliers(),
        getDepartments(),
        getApplicationGroups(),
        getApplicationRoles(),
        getServiceTypes(),
      ]);
      setAppModules(extractList<ApplicationSoftwareModule>(mods, ["modules", "software", "data"]));
      setWorkflows(extractList<Workflow>(wfs, ["workflows", "data"]));
      setUsers(extractList<User>(us, ["users", "data"]));
      setSuppliers(extractList<Supplier>(sups, ["suppliers", "data"]));
      setDepartments(extractList<Department>(deps, ["departments", "data"]));
      setApplicationGroups(extractList<ApplicationGroup>(ags, ["applicationGroups", "data"]));
      setRoles(extractList<Role>(rs, ["applicationRoles", "roles", "data"]));
      setServiceRequestTypes(
        extractList<ApplicationServiceRequestType>(srts, ["service_types", "serviceTypes", "data"])
      );
    })();
  }, [reFetch, includeDisabled]);


  const openEditModal = async (appId: string) => {
    setIsLoadingActive(true);
    try {
      const full = await getApplicationById(appId);
      setActiveApplication(full as Application);
      openModal();
    } catch (e) {
      console.error("Failed to load application details", e);
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
      attachments: existingAttachments ?? [],
    };
    if (activeApplication) {
      const updated = await updateApplication(
        activeApplication._id,
        payloadWithAttachments,
        newAttachments
      );
      setApplications((prev) =>
        prev?.map((a) => (a._id === updated._id ? (updated as Application) : a))
      );
    } else {
      const created = await createApplication(payloadWithAttachments, newAttachments);
      setApplications((prev) => [(created as Application), ...prev]);
    }
    setActiveApplication(null);
    setReFetch(!reFetch);
    closeModal();
  };

  const handleStatusChange = async (app: Application) => {
    const enable = app.status !== "enabled";
    // optimistic UI
    setApplications(prev =>
      prev.map(a => (a._id === app._id ? { ...a, status: enable ? "enabled" : "disabled" } : a))
    );
    try {
      if (enable) {
        await enableApplication(app._id);
      } else {
        await disableApplication(app._id);
      }
    } catch (e) {
      // rollback
      setApplications(prev =>
        prev.map(a => (a._id === app._id ? { ...a, status: app.status } : a))
      );
      console.error("Application status update failed:", e);
    }
  };

  const confirmDelete = async () => {
    if (!appToDelete) return;
    await deleteApplication(appToDelete._id);
    setApplications(prev => prev.filter(a => a._id !== appToDelete._id));
    setConfirmationModal(false);
    setAppToDelete(null);
  };

  return (
    <>
      {/* Header & Create */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpApplications")}
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
              setActiveApplication(null);
              openModal();
            }}
            disabled={isLoadingActive}
          >
            {t("create", { entity: t("gxpApplications") })}
          </Button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {["applicationName", "applicationType", "applicationEnvironment", "applicationGroups", "status", "actions"].map(key => (
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
            {applications?.map(app => (
              <tr key={app._id}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {app.applicationName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {app.applicationType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {typeof app.applicationEnvironment === "object"
                    ? app.applicationEnvironment?.environmentName ?? "-"
                    : app.applicationEnvironment ?? "-"}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {app.group ?? "-"}
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {app.applicationGroups?.map((g) => g.appGroup).join(", ") || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Switch
                    label={app.status === "enabled" ? t("enabled") : t("disabled")}
                    checked={app.status === "enabled"}
                    onChange={() => handleStatusChange(app)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    onClick={() => openEditModal(app._id)}
                    disabled={isLoadingActive}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    onClick={() => {
                      setAppToDelete(app);
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
            {applications?.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                >
                  {t("noRecordsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[70rem] max-h-[45rem] overflow-y-auto no-scrollbar  bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateApplicationModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeApplication || undefined}
          optionSets={{
            environments,
            locations,
            applicationGroups,
            appModules,
            workflows,
            users,
            suppliers,
            departments,
            roles,
            serviceRequestTypes,
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {t("deleteEntityPrompt", { entityName: appToDelete?.applicationName })}
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

export default GXPAddNewApplicationPage;
