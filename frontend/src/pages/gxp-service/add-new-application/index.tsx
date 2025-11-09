
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
  getAssignmentGroups,
  getWorkflows,
  getSuppliers,
  getApplicationSoftware,
  getApplicationServices,
} from "@/services/gxp.service";
import CreateApplicationModal from "./CreateApplicationModal";
import Switch from "@/components/common/form/switch/Switch";
import { getDepartments, getRoles, getUsers } from "@/services/admin.service";

type Application = {
  _id: string;
  applicationName: string;
  applicationType: "GxP" | "Non-GxP";
  applicationEnvironment?: string;
  group: string;
  applicationRoles: string[];
  applicationGroups: string[];
  applicationServiceRequestTypes: string[];
  applicationModules: string[];
  applicationWorkflow?: string;
  applicationSystemOwner?: string;
  applicationProcessOwner?: string;
  supplier?: string;
  departments: string[];
  notes?: string;
  attachments: string[];
  status: "enabled" | "disabled";
  createdOn?: string | null;
  createdBy?: string | null;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
};

const GXPAddNewApplicationPage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);

  // Option lists
  const [environments, setEnvironments] = useState<any[]>([]);
  const [assignmentGroups, setAssignmentGroups] = useState<any[]>([]);
  const [appRoles, setAppRoles] = useState<any[]>([]);
  const [appGroups, setAppGroups] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [appModules, setAppModules] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  // helper: normalize direct calls that may return {data: []} or []
  const ensureArray = (val: any) =>
    Array.isArray(val) ? val : (val?.data && Array.isArray(val.data) ? val.data : []);

  // helper: pick the first array from a settled result by preferred keys, then fallback
  const extractList = (
    settled: PromiseSettledResult<any>,
    preferredKeys: string[] = []
  ) => {
    if (!settled || settled.status !== "fulfilled") return [];

    const v = settled.value;

    // 1) direct array
    if (Array.isArray(v)) return v;

    // 2) common keys
    if (Array.isArray(v?.data)) return v.data;
    for (const k of preferredKeys) {
      if (Array.isArray(v?.[k])) return v[k];
    }

    // 3) fallback: first array found among values
    const firstArray = Object.values(v).find(Array.isArray);
    return Array.isArray(firstArray) ? firstArray : [];
  };

  useEffect(() => {
    (async () => {
      const { applications } = await getApplications();
      setApplications(applications);
      const [envs, groups] = await Promise.all([getEnvironments(), getAssignmentGroups()]);
      setEnvironments(ensureArray(envs));
      setAssignmentGroups(ensureArray(groups));
      // load option sets (any shape tolerated)
      const [roles, ags, srs, mods, wfs, us, sups,deps] = await Promise.allSettled([
        getRoles(),              
        getAssignmentGroups(),    
        getApplicationServices(), // if you re-enable later
        getApplicationSoftware(), 
        getWorkflows(),            
        getUsers(),                
        getSuppliers(),            
        getDepartments(),         
      ]);

      setAppRoles(extractList(roles, ["roles"]));
      setAppGroups(extractList(ags, ["groups", "data"]));
      setServiceTypes(extractList(srs, ["serviceRequestTypes", "data"])); // if enabled
      setAppModules(extractList(mods, ["modules", "software", "data"]));
      setWorkflows(extractList(wfs, ["workflows", "data"]));
      setUsers(extractList(us, ["users", "data"]));
      setSuppliers(extractList(sups, ["suppliers", "data"]));
      setDepartments(extractList(deps, ["departments", "data"]));
    })();
  }, [reFetch]);


  const openEditModal = (app: Application) => {
    setActiveApplication(app);
    openModal();
  };

  const handleSave = async (data: Partial<Application>) => {
    if (activeApplication) {
      const updated = await updateApplication(activeApplication._id, data);
      setApplications(prev => prev.map(a => (a._id === updated._id ? updated : a)));
    } else {
      const created = await createApplication(data);
      setApplications(prev => [created, ...prev]);
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
        <Button
          onClick={() => {
            setActiveApplication(null);
            openModal();
          }}
        >
          {t("create", { entity: t("gxpApplications") })}
        </Button>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {["applicationName", "applicationType", "applicationEnvironment", "group", "status", "actions"].map(key => (
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
                  {app.applicationEnvironment ?? "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {app.group ?? "-"}
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
                    onClick={() => openEditModal(app)}
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
        className="max-w-[1000px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateApplicationModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeApplication || undefined}
          optionSets={{
            environments,
            assignmentGroups,
            appRoles,
            appGroups,
            serviceTypes,
            appModules,
            workflows,
            users,
            suppliers,
            departments,
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
