import { toast } from "@/lib/ToastProvider";
import gxpApi from "../utils/gxp.axios.interceptor";

export const API_ROUTES = {
  suppliers: "/gxp-suppliers",
  workflows: "/gxp-workflows",
  assignmentGroups: "/gxp-assignment-groups",
  environments: "/gxp-environments",
  gxpPermissions: "/gxp-permissions",
  gxpRoles: "/gxp-roles",
  gxpApplications: "/gxp-applications",
  gxpApplicationSoftware: "/gxp-application-software",
  gxpApplicationServices: "/gxp-applications-services",
  gxpUsers: "/gxp-users"
};

// #region Supplier

export const getSuppliers = async (includeDisabled: boolean = false) => {
  let url = API_ROUTES.suppliers;
  if (includeDisabled) {
    url = `${API_ROUTES.suppliers}?includeDisabled=true`;
  }
  const response = await gxpApi.get(url);
  return response["data"];
};

export const createSupplier = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.suppliers, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateSupplier = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.suppliers}/${id}`, payload);
  console.log(response);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteSupplier = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.suppliers}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const enableSupplier = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.suppliers}/enable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const disableSupplier = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.suppliers}/disable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

// #endregion

// #region Workflow

export const getWorkflows = async () => {
  const response = await gxpApi.get(API_ROUTES.workflows);
  return response["data"];
};

export const createWorkflow = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.workflows, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateWorkflow = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.workflows}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteWorkflow = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.workflows}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const enableWorkflow = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.workflows}/enable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
}

export const disableWorkflow = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.workflows}/disable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
}

// #endregion

// #region Assignment Group

export const getAssignmentGroups = async (includeInactive: boolean = false) => {
  let url = API_ROUTES.assignmentGroups;
  if (includeInactive) {
    url = `${API_ROUTES.assignmentGroups}?includeInactive=true`;
  }
  const response = await gxpApi.get(url);
  return response["data"];
};

export const createAssignmentGroup = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.assignmentGroups, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateAssignmentGroup = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.assignmentGroups}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteAssignmentGroup = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.assignmentGroups}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const enableAssignmentGroup = async (groupName: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.assignmentGroups}/enable/${groupName}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const disableAssignmentGroup = async (groupName: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.assignmentGroups}/disable/${groupName}`);
  toast(response.data.message, "success");
  return response["data"];
};

// #endregion

// #region Environment

export const getEnvironments = async (includeDisabled: boolean = false) => {
  let url = API_ROUTES.environments;
  if (includeDisabled) {
    url = `${API_ROUTES.environments}?includeDisabled=true`;
  }
  const response = await gxpApi.get(url);
  return response["data"];
};

export const createEnvironment = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.environments, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateEnvironment = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.environments}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteEnvironment = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.environments}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const enableEnvironment = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.environments}/enable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const disableEnvironment = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.environments}/disable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};


// #region GXP-Application-Software
export const getApplicationSoftware = async (includeDisabled: boolean = false) => {
  let url = API_ROUTES.gxpApplicationSoftware;
  if (includeDisabled) {
    url = `${API_ROUTES.gxpApplicationSoftware}?includeDisabled=true`;
  }
  const response = await gxpApi.get(url);
  return response["data"];
};

// Create new Application Software record
export const createApplicationSoftware = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpApplicationSoftware, payload);
  toast(response.data.message, "success");
  return response["data"];
};

// Update existing Application Software record
export const updateApplicationSoftware = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplicationSoftware}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

// Delete Application Software record
export const deleteApplicationSoftware = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpApplicationSoftware}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

// Enable Application Software
export const enableApplicationSoftware = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplicationSoftware}/enable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

// Disable Application Software
export const disableApplicationSoftware = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplicationSoftware}/disable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};
// #endregion


// #endregion

// #region Raise-Application
export const getApplications = async (includeDisabled: boolean = false) => {
  let url = API_ROUTES.gxpApplications;
  if (includeDisabled) {
    url = `${API_ROUTES.gxpApplications}?includeDisabled=true`;
  }
  const response = await gxpApi.get(url);
  return response["data"];
};

export const createApplication = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpApplications, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateApplication = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplications}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteApplication = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpApplications}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const enableApplication = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplications}/enable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const disableApplication = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplications}/disable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

// #endregion

// #region GXP Permission

export const getGxpPermissions = async () => {
  const response = await gxpApi.get(API_ROUTES.gxpPermissions);
  return response["data"];
};

export const createGxpPermission = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpPermissions, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateGxpPermission = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpPermissions}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteGxpPermission = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpPermissions}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

// #endregion

// #region GXP Role

export const getGxpRoles = async () => {
  const response = await gxpApi.get(API_ROUTES.gxpRoles);
  return response["data"];
};

export const createGxpRole = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpRoles, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateGxpRole = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpRoles}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteGxpRole = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpRoles}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

// #endregion

// #region Application Services
export const getApplicationServices = async (includeDisabled: boolean = false) => {
  let url = API_ROUTES.gxpApplicationServices;
  if (includeDisabled) {
    url = `${API_ROUTES.gxpApplicationServices}?includeDisabled=true`;
  }
  const response = await gxpApi.get(url);
  return response["data"];
};

export const createApplicationService = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpApplicationServices, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateApplicationService = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplicationServices}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteApplicationService = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpApplicationServices}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const enableApplicationService = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplicationServices}/enable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const disableApplicationService = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpApplicationServices}/disable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};
// #endregion

// #region GXP Users
export const getGxpUsers = async (includeDisabled: boolean = false) => {
  let url = API_ROUTES.gxpUsers;
  if (includeDisabled) {
    url = `${API_ROUTES.gxpUsers}?includeDisabled=true`;
  }
  const response = await gxpApi.get(url);
  return response["data"];
};

export const createGxpUser = async (payload: Record<string, any>) => {
  const response = await gxpApi.post(API_ROUTES.gxpUsers, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateGxpUser = async (id: string, payload: Record<string, any>) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpUsers}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteGxpUser = async (id: string) => {
  const response = await gxpApi.delete(`${API_ROUTES.gxpUsers}/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const enableGxpUser = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpUsers}/enable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};

export const disableGxpUser = async (id: string) => {
  const response = await gxpApi.patch(`${API_ROUTES.gxpUsers}/disable/${id}`);
  toast(response.data.message, "success");
  return response["data"];
};
// #endregion
