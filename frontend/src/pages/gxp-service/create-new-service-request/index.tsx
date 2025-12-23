import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useGlobalContext } from "@/context";
import {
  getServiceRequests,
  createServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceRequestById,
  getApplications,
  getEnvironments,
  getAssignmentGroups,
  getWorkflows,
  getApplicationSoftware,
  getGxpRoles
} from "@/services/gxp.service";
import { getLocations } from "@/services/admin.service";
import { ServiceRequestFormOutput } from "@/lib/schema";
import CreateServiceRequestModal from "./CreateServiceRequestModal";
import { applicationServiceRequestTypeOptions } from "@/types/common.types";
import { ServiceRequest } from "@/types/gxp-service.types";

type Lookup = Record<string, string>;

const GXPCreateNewServiceRequestPage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);

  const [applications, setApplications] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [assignmentGroups, setAssignmentGroups] = useState<any[]>([]);
  const [appModules, setAppModules] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const ensureArray = (val: any) =>
    Array.isArray(val) ? val : (val?.data && Array.isArray(val.data) ? val.data : []);

  const normalizeServiceRequest = (req: any): ServiceRequest => ({
    _id: req?._id ?? "",
    group: req?.group ?? "",
    priority: req?.priority ?? "Medium",
    application: req?.application?? "",
    environment: req?.environment ?? "",
    module: req?.module ?? "",
    requestRole: req?.requestRole ?? "",
    esignCheck: req?.esignCheck ?? "No",
    trainingDone: req?.trainingDone ?? true,
    description: req?.description ?? "",
    shortDescription: req?.shortDescription ?? "",
    note: req?.note ?? "",
    workflow: req?.workflow ?? "",
    requestType: req?.requestType ?? "Applications",
    status: req?.status ?? "New",
    attachments: req?.attachments ?? [],
    location: req?.location?._id ?? req?.location ?? "",
    comments: req?.comments ?? [],
    createdBy: req?.createdBy,
    createdAt: req?.createdAt,
    updatedAt: req?.updatedAt
  });

  const extractList = (settled: PromiseSettledResult<any>, preferredKeys: string[] = []) => {
    if (!settled || settled.status !== "fulfilled") return [];
    const v = settled.value;
    if (Array.isArray(v)) return v;
    if (Array.isArray(v?.data)) return v.data;
    for (const key of preferredKeys) {
      if (Array.isArray(v?.[key])) return v[key];
    }
    const firstArray = Object.values(v).find(Array.isArray);
    return Array.isArray(firstArray) ? firstArray : [];
  };

  useEffect(() => {
    (async () => {
      const [requests, apps, envs, groups, locs] = await Promise.all([
        getServiceRequests(),
        getApplications(),
        getEnvironments(),
        getAssignmentGroups(),
        getLocations()
      ])
      setServiceRequests(ensureArray(requests).map(normalizeServiceRequest));
      setApplications(ensureArray(apps));
      setEnvironments(ensureArray(envs));
      setAssignmentGroups(ensureArray(groups));
      setLocations(ensureArray(locs.locations));

      const [mods, wfs, rls] = await Promise.allSettled([
        getApplicationSoftware(),
        getWorkflows(),
        getGxpRoles()
      ]);
      setAppModules(extractList(mods));
      setWorkflows(extractList(wfs));
      setRoles(extractList(rls, ["roles"]));
    })();
  }, [reFetch]);

  const requestTypeOptions = useMemo(
    () =>
      applicationServiceRequestTypeOptions.map((opt) => ({
        label: opt.label,
        value: opt.value
      })),
    []
  );

  const openEditModal = async (requestId: string) => {
    setIsLoadingActive(true);
    try {
      const full = await getServiceRequestById(requestId);
      setActiveRequest(normalizeServiceRequest(full));
      openModal();
    } catch (e) {
      console.error("Failed to load service request details", e);
    } finally {
      setIsLoadingActive(false);
    }
  };

  const appendFormValue = (fd: FormData, key: string, value: any) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => appendFormValue(fd, key, v));
      return;
    }
    const normalized = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
    fd.append(key, normalized);
  };

  const handleSave = async (
    data: ServiceRequestFormOutput,
    attachments: File[],
    existingAttachments: string[]
  ) => {
    const payloadWithAttachments: ServiceRequestFormOutput = {
      ...data,
      attachments: existingAttachments || []
    };

    try {
      if (activeRequest) {
        const formData = new FormData();
        Object.entries(payloadWithAttachments || {}).forEach(([key, value]) =>
          appendFormValue(formData, key, value)
        );
        attachments?.forEach((file) => formData.append("attachments", file));

        const updated = await updateServiceRequest(activeRequest._id, formData);
        setServiceRequests((prev) =>
          prev.map((req) =>
            req._id === updated?._id ? normalizeServiceRequest(updated) : req
          )
        );
      } else {
        const formData = new FormData();
        Object.entries(payloadWithAttachments || {}).forEach(([key, value]) =>
          appendFormValue(formData, key, value)
        );
        attachments?.forEach((file) => formData.append("attachments", file));
        const created = await createServiceRequest(formData);
        setServiceRequests((prev) => [normalizeServiceRequest(created), ...(prev || [])]);
      }
      setActiveRequest(null);
      setReFetch(!reFetch);
      closeModal();
    } catch (e) {
      console.error("Failed to save service request", e);
    }
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;
    await deleteServiceRequest(requestToDelete._id);
    setServiceRequests((prev) => prev.filter((req) => req._id !== requestToDelete._id));
    setConfirmationModal(false);
    setRequestToDelete(null);
  };

  const nameLookup = (items: any[], nameKey: string, valueKey: string = "_id"): Lookup =>
    items.reduce((acc: Lookup, item: any) => {
      const value = item?.[valueKey];
      const label = item?.[nameKey] ?? item?.name ?? value;
      if (value) acc[String(value)] = String(label);
      return acc;
    }, {});

  const applicationLookup = useMemo(
    () => nameLookup(applications, "applicationName", "_id"),
    [applications]
  );

  const workflowLookup = useMemo(
    () => nameLookup(workflows, "workflowName", "_id"),
    [workflows]
  );
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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpCreateNewServiceRequest")}
        </h1>
        <Button
          onClick={() => {
            setActiveRequest(null);
            openModal();
          }}
          disabled={isLoadingActive}
        >
          {t("create", { entity: t("serviceRequests") })}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {[
                "shortDescription",
                "application",
                "workflow",
                "priority",
                "status",
                "actions"
              ].map((key) => (
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
            {serviceRequests?.map((req) => (
              <tr key={req._id}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {req.shortDescription}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {formatValue(req.application, applicationLookup, "applicationName")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {formatValue(req.workflow, workflowLookup, "workflowName")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {req.priority}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {req.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    onClick={() => openEditModal(req._id)}
                    disabled={isLoadingActive}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    onClick={() => {
                      setRequestToDelete(req);
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
            {serviceRequests?.length === 0 && (
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

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[70rem] max-h-[45rem] m-4 overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateServiceRequestModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeRequest || undefined}
          optionSets={{
            applications,
            environments,
            assignmentGroups,
            appModules,
            workflows,
            roles,
            requestTypes: requestTypeOptions,
            locations
          }}
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
            {t("deleteEntityPrompt", { entityName: requestToDelete?.shortDescription })}
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

export default GXPCreateNewServiceRequestPage;
