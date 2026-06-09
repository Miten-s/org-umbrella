import { toast } from "@/lib/toast";
import { ListQueryParams, withDefaultListParams } from "@/utils/listResponse";
import gxpApi from "../utils/gxp.axios.interceptor";

const getSuccessMessage = (response: any, fallback: string) =>
  response?.data?.message || response?.message || fallback;

const toastSuccess = (response: any, fallback: string) =>
  toast(getSuccessMessage(response, fallback), "success");

type SilentOptions = { silent?: boolean };

const postBulkIds = async (
  route: string,
  action: "bulk-delete" | "bulk-duplicate",
  ids: string[],
  successMessage: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.post(`${route}/${action}`, { ids });
  if (!options?.silent) {
    toastSuccess(response, successMessage);
  }
  return response["data"];
};

const buildListParams = (
  params?: ListQueryParams,
  extraParams: Record<string, unknown> = {}
) =>
  withDefaultListParams({
    ...extraParams,
    ...params
  });

export const API_ROUTES = {
  suppliers: "/gxp-suppliers",
  workflows: "/gxp-workflows",
  assignmentGroups: "/gxp-assignment-groups",
  environments: "/gxp-environments",
  gxpPermissions: "/gxp-permissions",
  gxpRoles: "/gxp-roles",
  gxpApplications: "/gxp-applications",
  gxpApplicationGroups: "/gxp-applications/application-groups",
  gxpApplicationRoles: "/gxp-applications/application-roles",
  gxpApplicationSoftware: "/gxp-application-modules",
  gxpApplicationServices: "/gxp-applications-services",
  gxpUsers: "/gxp-users",
  gxpServiceRequests: "/gxp-service-requests",
  gxpServiceTypes: "/gxp-service-requests/service-types"
};

// #region Supplier

export const getSuppliers = async (
  includeDisabled: boolean = false,
  params?: ListQueryParams
) => {
  const response = await gxpApi.get(API_ROUTES.suppliers, {
    params: buildListParams(
      params,
      includeDisabled ? { includeDisabled: true } : {}
    )
  });
  return response["data"];
};

export const createSupplier = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.suppliers, payload);
  toastSuccess(response, "Supplier created successfully");
  return response["data"];
};

export const updateSupplier = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(`${API_ROUTES.suppliers}/${id}`, payload);
  toastSuccess(response, "Supplier updated successfully");
  return response["data"];
};

export const deleteSupplier = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(`${API_ROUTES.suppliers}/${id}`);
  if (!options?.silent) {
    toastSuccess(response, "Supplier deleted successfully");
  }
  return response["data"];
};

export const bulkDeleteSuppliers = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.suppliers,
    "bulk-delete",
    ids,
    "Suppliers deleted successfully",
    options
  );

export const bulkDuplicateSuppliers = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.suppliers,
    "bulk-duplicate",
    ids,
    "Suppliers copied successfully",
    options
  );

export const enableSupplier = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.suppliers}/enable/${id}`);
  toastSuccess(response, "Supplier enabled successfully");
  return response["data"];
};

export const disableSupplier = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.suppliers}/disable/${id}`);
  toastSuccess(response, "Supplier disabled successfully");
  return response["data"];
};

// #endregion

// #region Workflow

export const getWorkflows = async (params?: ListQueryParams) => {
  const response = await gxpApi.get(API_ROUTES.workflows, {
    params: buildListParams(params)
  });
  return response["data"];
};

export const getApplicationGroups = async (params?: ListQueryParams) => {
  const response = await gxpApi.get(API_ROUTES.gxpApplicationGroups, {
    params: buildListParams(params)
  });
  return response["data"];
};

export const getApplicationRoles = async (params?: ListQueryParams) => {
  const response = await gxpApi.get(API_ROUTES.gxpApplicationRoles, {
    params: buildListParams(params)
  });
  return response["data"];
};

export const createWorkflow = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.workflows, payload);
  toastSuccess(response, "Workflow created successfully");
  return response["data"];
};

export const updateWorkflow = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(`${API_ROUTES.workflows}/${id}`, payload);
  toastSuccess(response, "Workflow updated successfully");
  return response["data"];
};

export const deleteWorkflow = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(`${API_ROUTES.workflows}/${id}`);
  if (!options?.silent) {
    toastSuccess(response, "Workflow deleted successfully");
  }
  return response["data"];
};

export const bulkDeleteWorkflows = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.workflows,
    "bulk-delete",
    ids,
    "Workflows deleted successfully",
    options
  );

export const bulkDuplicateWorkflows = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.workflows,
    "bulk-duplicate",
    ids,
    "Workflows copied successfully",
    options
  );

export const enableWorkflow = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.workflows}/enable/${id}`);
  toastSuccess(response, "Workflow enabled successfully");
  return response["data"];
};

export const disableWorkflow = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.workflows}/disable/${id}`);
  toastSuccess(response, "Workflow disabled successfully");
  return response["data"];
};

// #endregion

// #region Assignment Group

export const getAssignmentGroups = async (
  includeInactive: boolean = false,
  params?: ListQueryParams
) => {
  const response = await gxpApi.get(API_ROUTES.assignmentGroups, {
    params: buildListParams(
      params,
      includeInactive ? { includeInactive: true } : {}
    )
  });
  return response["data"];
};

export const createAssignmentGroup = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.assignmentGroups, payload);
  toastSuccess(response, "Assignment group created successfully");
  return response["data"];
};

export const updateAssignmentGroup = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.assignmentGroups}/${id}`,
    payload
  );
  toastSuccess(response, "Assignment group updated successfully");
  return response["data"];
};

export const deleteAssignmentGroup = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(`${API_ROUTES.assignmentGroups}/${id}`);
  if (!options?.silent) {
    toastSuccess(response, "Assignment group deleted successfully");
  }
  return response["data"];
};

export const bulkDeleteAssignmentGroups = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.assignmentGroups,
    "bulk-delete",
    ids,
    "Assignment groups deleted successfully",
    options
  );

export const bulkDuplicateAssignmentGroups = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.assignmentGroups,
    "bulk-duplicate",
    ids,
    "Assignment groups copied successfully",
    options
  );

export const enableAssignmentGroup = async (groupName: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.assignmentGroups}/enable/${groupName}`
  );
  toastSuccess(response, "Assignment group enabled successfully");
  return response["data"];
};

export const disableAssignmentGroup = async (groupName: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.assignmentGroups}/disable/${groupName}`
  );
  toastSuccess(response, "Assignment group disabled successfully");
  return response["data"];
};

// #endregion

// #region Environment

export const getEnvironments = async (
  includeDisabled: boolean = false,
  params?: ListQueryParams
) => {
  const response = await gxpApi.get(API_ROUTES.environments, {
    params: buildListParams(
      params,
      includeDisabled ? { includeDisabled: true } : {}
    )
  });
  return response["data"];
};

export const createEnvironment = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.environments, payload);
  toastSuccess(response, "Environment created successfully");
  return response["data"];
};

export const updateEnvironment = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.environments}/${id}`,
    payload
  );
  toastSuccess(response, "Environment updated successfully");
  return response["data"];
};

export const deleteEnvironment = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(`${API_ROUTES.environments}/${id}`);
  if (!options?.silent) {
    toastSuccess(response, "Environment deleted successfully");
  }
  return response["data"];
};

export const bulkDeleteEnvironments = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.environments,
    "bulk-delete",
    ids,
    "Environments deleted successfully",
    options
  );

export const bulkDuplicateEnvironments = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.environments,
    "bulk-duplicate",
    ids,
    "Environments copied successfully",
    options
  );

export const enableEnvironment = async (id: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.environments}/enable/${id}`
  );
  toastSuccess(response, "Environment enabled successfully");
  return response["data"];
};

export const disableEnvironment = async (id: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.environments}/disable/${id}`
  );
  toastSuccess(response, "Environment disabled successfully");
  return response["data"];
};

// #region GXP-Application-Software
export const getApplicationSoftware = async (
  includeDisabled: boolean = false,
  params?: ListQueryParams
) => {
  const response = await gxpApi.get(API_ROUTES.gxpApplicationSoftware, {
    params: buildListParams(
      params,
      includeDisabled ? { includeDisabled: true } : {}
    )
  });
  return response["data"];
};

// Create new Application Software record
export const createApplicationSoftware = async (
  payload: Record<string, any>
) => {
  const response = await gxpApi.post(
    API_ROUTES.gxpApplicationSoftware,
    payload
  );
  toastSuccess(response, "Application software created successfully");
  return response["data"];
};

// Update existing Application Software record
export const updateApplicationSoftware = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplicationSoftware}/${id}`,
    payload
  );
  toastSuccess(response, "Application software updated successfully");
  return response["data"];
};

// Delete Application Software record
export const deleteApplicationSoftware = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(
    `${API_ROUTES.gxpApplicationSoftware}/${id}`
  );
  if (!options?.silent) {
    toastSuccess(response, "Application software deleted successfully");
  }
  return response["data"];
};

export const bulkDeleteApplicationSoftware = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.gxpApplicationSoftware,
    "bulk-delete",
    ids,
    "Application modules deleted successfully",
    options
  );

export const bulkDuplicateApplicationSoftware = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.gxpApplicationSoftware,
    "bulk-duplicate",
    ids,
    "Application modules copied successfully",
    options
  );

// Enable Application Software
export const enableApplicationSoftware = async (id: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplicationSoftware}/status/${id}`,
    { status: "enabled" }
  );
  toastSuccess(response, "Application software enabled successfully");
  return response["data"];
};

// Disable Application Software
export const disableApplicationSoftware = async (id: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplicationSoftware}/status/${id}`,
    { status: "disabled" }
  );
  toastSuccess(response, "Application software disabled successfully");
  return response["data"];
};
// #endregion

// #endregion

// #region Raise-Application
export const getApplications = async (
  includeDisabled: boolean = false,
  params?: ListQueryParams
) => {
  const response = await gxpApi.get(API_ROUTES.gxpApplications, {
    params: buildListParams(
      params,
      includeDisabled ? { includeDisabled: true } : {}
    )
  });
  return response["data"];
};

export const getApplicationById = async (id: string) => {
  const response = await gxpApi.get(`${API_ROUTES.gxpApplications}/${id}`);
  return response["data"];
};

const buildApplicationFormData = (
  payload: Record<string, any>,
  files?: File[]
) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  (files || []).forEach((file) => formData.append("attachments", file));
  return formData;
};

export const createApplication = async (
  payload: Record<string, any>,
  files?: File[]
) => {
  const response = await gxpApi.post(
    API_ROUTES.gxpApplications,
    buildApplicationFormData(payload, files),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  toastSuccess(response, "Application created successfully");
  return response["data"];
};

export const updateApplication = async (
  id: string,
  payload: Record<string, any>,
  files?: File[]
) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplications}/${id}`,
    buildApplicationFormData(payload, files),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  toastSuccess(response, "Application updated successfully");
  return response["data"];
};

export const deleteApplication = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpApplications}/${id}`);
  if (!options?.silent) {
    toastSuccess(response, "Application deleted successfully");
  }
  return response["data"];
};

export const duplicateApplication = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.post(
    `${API_ROUTES.gxpApplications}/${id}/duplicate`
  );
  if (!options?.silent) {
    toastSuccess(response, "Application duplicated successfully");
  }
  return response["data"];
};

export const bulkDeleteApplications = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.gxpApplications,
    "bulk-delete",
    ids,
    "Applications deleted successfully",
    options
  );

export const bulkDuplicateApplications = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.gxpApplications,
    "bulk-duplicate",
    ids,
    "Applications copied successfully",
    options
  );

export const enableApplication = async (id: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplications}/enable/${id}`
  );
  toastSuccess(response, "Application enabled successfully");
  return response["data"];
};

export const disableApplication = async (id: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplications}/disable/${id}`
  );
  toastSuccess(response, "Application disabled successfully");
  return response["data"];
};

// #endregion

// #region GXP Permission

export const getGxpPermissions = async (params?: ListQueryParams) => {
  const response = await gxpApi.get(API_ROUTES.gxpPermissions, {
    params: buildListParams(params)
  });
  return response["data"];
};

export const createGxpPermission = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpPermissions, payload);
  toastSuccess(response, "Permission created successfully");
  return response["data"];
};

export const updateGxpPermission = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpPermissions}/${id}`,
    payload
  );
  toastSuccess(response, "Permission updated successfully");
  return response["data"];
};

export const deleteGxpPermission = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpPermissions}/${id}`);
  if (!options?.silent) {
    toastSuccess(response, "Permission deleted successfully");
  }
  return response["data"];
};

// #endregion

// #region GXP Role

export const getGxpRoles = async (params?: ListQueryParams) => {
  const response = await gxpApi.get(API_ROUTES.gxpRoles, {
    params: buildListParams(params)
  });
  return response["data"];
};

export const createGxpRole = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpRoles, payload);
  toastSuccess(response, "Role created successfully");
  return response["data"];
};

export const updateGxpRole = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpRoles}/${id}`, payload);
  toastSuccess(response, "Role updated successfully");
  return response["data"];
};

export const deleteGxpRole = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpRoles}/${id}`);
  toastSuccess(response, "Role deleted successfully");
  return response["data"];
};

// #endregion

// #region Application Services
export const getApplicationServices = async (
  includeDisabled: boolean = false,
  params?: ListQueryParams
) => {
  const response = await gxpApi.get(API_ROUTES.gxpApplicationServices, {
    params: buildListParams(
      params,
      includeDisabled ? { includeDisabled: true } : {}
    )
  });
  return response["data"];
};

export const createApplicationService = async (
  payload: Record<string, any>
) => {
  const response = await gxpApi.post(
    API_ROUTES.gxpApplicationServices,
    payload
  );
  toastSuccess(response, "Application service created successfully");
  return response["data"];
};

export const updateApplicationService = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplicationServices}/${id}`,
    payload
  );
  toastSuccess(response, "Application service updated successfully");
  return response["data"];
};

export const deleteApplicationService = async (id: string) => {
  const response = await gxpApi.delete(
    `${API_ROUTES.gxpApplicationServices}/${id}`
  );
  toastSuccess(response, "Application service deleted successfully");
  return response["data"];
};

export const enableApplicationService = async (id: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplicationServices}/enable/${id}`
  );
  toastSuccess(response, "Application service enabled successfully");
  return response["data"];
};

export const disableApplicationService = async (id: string) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpApplicationServices}/disable/${id}`
  );
  toastSuccess(response, "Application service disabled successfully");
  return response["data"];
};
// #endregion

// #region Service Requests
export const getServiceRequests = async (params?: ListQueryParams) => {
  const response = await gxpApi.get(API_ROUTES.gxpServiceRequests, {
    params: buildListParams(params)
  });
  return response["data"];
};

export const getServiceRequestById = async (id: string) => {
  const response = await gxpApi.get(`${API_ROUTES.gxpServiceRequests}/${id}`);
  return response["data"];
};

const buildServiceRequestFormData = (
  payload: Record<string, any>,
  files?: File[]
) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  (files || []).forEach((file) => formData.append("attachments", file));
  return formData;
};

export const createServiceRequest = async (
  payload: Record<string, any>,
  files?: File[]
) => {
  const response = await gxpApi.post(
    API_ROUTES.gxpServiceRequests,
    buildServiceRequestFormData(payload, files),
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
  toastSuccess(response, "Service request created successfully");
  return response["data"];
};

export const updateServiceRequest = async (
  id: string,
  payload: Record<string, any>,
  files?: File[]
) => {
  const response = await gxpApi.patch(
    `${API_ROUTES.gxpServiceRequests}/${id}`,
    buildServiceRequestFormData(payload, files),
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
  toastSuccess(response, "Service request updated successfully");
  return response["data"];
};

export const deleteServiceRequest = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(
    `${API_ROUTES.gxpServiceRequests}/${id}`
  );
  if (!options?.silent) {
    toastSuccess(response, "Service request deleted successfully");
  }
  return response["data"];
};

export const bulkDeleteServiceRequests = async (
  ids: string[],
  options?: SilentOptions
) =>
  postBulkIds(
    API_ROUTES.gxpServiceRequests,
    "bulk-delete",
    ids,
    "Service requests deleted successfully",
    options
  );

export const deleteServiceRequestAttachment = async (attachmentId: string) => {
  const response = await gxpApi.delete(
    `${API_ROUTES.gxpServiceRequests}/attachments/${attachmentId}`
  );
  toastSuccess(response, "Attachment removed successfully");
  return response["data"];
};

export const getServiceTypes = async (params?: ListQueryParams) => {
  const response = await gxpApi.get(API_ROUTES.gxpServiceTypes, {
    params: buildListParams(params)
  });
  return response["data"];
};
// #endregion

// #region GXP Users
export const getGxpUsers = async (
  includeDisabled: boolean = false,
  params?: ListQueryParams
) => {
  const response = await gxpApi.get(API_ROUTES.gxpUsers, {
    params: buildListParams(
      params,
      includeDisabled ? { includeDisabled: true } : {}
    )
  });
  return response["data"];
};

export const createGxpUser = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpUsers, payload);
  toastSuccess(response, "User created successfully");
  return response["data"];
};

export const updateGxpUser = async (
  id: string,
  payload: Record<string, any>
) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpUsers}/${id}`, payload);
  toastSuccess(response, "User updated successfully");
  return response["data"];
};

export const deleteGxpUser = async (
  id: string,
  options?: SilentOptions
) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpUsers}/${id}`);
  if (!options?.silent) {
    toastSuccess(response, "User deleted successfully");
  }
  return response["data"];
};

export const enableGxpUser = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpUsers}/enable/${id}`);
  toastSuccess(response, "User enabled successfully");
  return response["data"];
};

export const disableGxpUser = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpUsers}/disable/${id}`);
  toastSuccess(response, "User disabled successfully");
  return response["data"];
};
// #endregion
