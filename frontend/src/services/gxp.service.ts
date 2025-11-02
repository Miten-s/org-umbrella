import { toast } from "@/lib/ToastProvider";
import gxpApi from "../utils/gxp.axios.interceptor";

export const API_ROUTES = {
  suppliers: "/gxp-suppliers",
  workflows: "/gxp-workflows",
  assignmentGroups: "/assignment-groups",
  environments: "/gxp-environments",
  gxpPermissions: "/gxp-permissions",
  gxpRoles: "/gxp-roles",
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

// #endregion

// #region Assignment Group

export const getAssignmentGroups = async () => {
  const response = await gxpApi.get(API_ROUTES.assignmentGroups);
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

// #endregion

// #region Environment

export const getEnvironments = async () => {
  const response = await gxpApi.get(API_ROUTES.environments);
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
