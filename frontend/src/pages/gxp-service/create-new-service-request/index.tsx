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
} from "@/services/gxp.service";
import { ServiceRequestFormOutput } from "@/lib/schema";
import CreateServiceRequestModal from "./CreateServiceRequestModal";
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

  const ensureArray = (val: any) =>
    Array.isArray(val) ? val : (val?.data && Array.isArray(val.data) ? val.data : []);

  const normalizeServiceRequest = (req: any): ServiceRequest => {
    const rawRequestTypes = req?.requestTypes;
    const normalizedApplication =
      req?.application && typeof req.application === "object"
        ? {
            ...req.application,
            applicationServiceRequestTypes:
              req.application.applicationServiceRequestTypes ??
              (Array.isArray(rawRequestTypes)
                ? rawRequestTypes
                : rawRequestTypes
                  ? [rawRequestTypes]
                  : [])
          }
        : req?.application ?? "";

    return {
      _id: req?._id ?? "",
      serviceRequestId: req?.serviceRequestId ?? "",
      priority: req?.priority ?? "Medium",
      application: normalizedApplication,
      esignCheck: req?.esignCheck ?? "No",
      trainingDone: req?.trainingDone ?? true,
      description: req?.description ?? "",
      shortDescription: req?.shortDescription ?? "",
      requestType: req?.requestType ?? "Applications",
      applicationEnvironment: req?.environment ?? req?.applicationEnvironment ?? "",
      assignmentGroup: req?.assignmentGroup ?? req?.group ?? "",
      groupLocation: req?.location ?? req?.groupLocation ?? "",
      applicationWorkflow: req?.applicationWorkflow ?? req?.workflow ?? "",
      applicationModules: req?.applicationModules ?? req?.modules ?? [],
      applicationServiceRequestTypes: (() => {
        const serviceValue =
          req?.applicationServiceRequestTypes ??
          req?.requestTypes ??
          req?.requestType;
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
      applicationRoles: req?.roles ?? req?.applicationRoles ?? [],
      notes: Array.isArray(req?.notes) ? req.notes.join("\n") : (req?.notes ?? ""),
      status: req?.status ?? "New",
      comments: req?.comments ?? [],
      attachments: req?.attachments ?? [],
      createdBy: req?.createdBy,
      createdAt: req?.createdAt,
      updatedAt: req?.updatedAt
    };
  };
  useEffect(() => {
    (async () => {
      const [requests, apps] = await Promise.all([
        getServiceRequests(),
        getApplications()
      ]);
      setServiceRequests(ensureArray(requests).map(normalizeServiceRequest));
      setApplications(ensureArray(apps));
    })();
  }, [reFetch]);

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

  const toServiceRequestPayload = (
    data: ServiceRequestFormOutput,
    existingAttachmentIds: string[]
  ) => {
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
        const updated = await updateServiceRequest(
          activeRequest._id,
          payload,
          newAttachments
        );
        setServiceRequests((prev) =>
          prev.map((req) =>
            req._id === updated?._id ? normalizeServiceRequest(updated) : req
          )
        );
      } else {
        const created = await createServiceRequest(payload, newAttachments);
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
                "serviceRequestId",
                "shortDescription",
                "application",
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
                  {req.serviceRequestId ?? "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {req.shortDescription}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {formatValue(req.application, applicationLookup, "applicationName")}
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
            applications
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
