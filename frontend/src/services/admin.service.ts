import { toast } from "@/lib/ToastProvider";
import api from "../utils/axios.interceptor";
import { RoleType } from "@/utils/common.constants";
import {
  ListQueryParams,
  withDefaultListParams
} from "@/utils/listResponse";

export const API_ROUTES = {
  login: "/auth/sign-in",
  logout: "/auth/sign-out",
  me: "/auth/me",

  users: "/auth/users",
  roles: "/roles",
  permissions: "/permissions",

  departments: "/departments",
  locations: "/locations",
  designations: "/designations",

  company: "/company",

};

// #region Auth

export const loginUser = async (payload: Record<string, string>) => {
  const response = await api.post(API_ROUTES.login, payload);
  toast(response.data.message, "success");
  return response["data"]
};

export const logoutUser = async () => {
  const response = await api.post(API_ROUTES.logout);
  return response["data"]
};

export const getUserDetail = async () => {
  const response = await api.get(API_ROUTES.me);
  return response["data"]
};

// #endregion

// #region User Management

export const getUsers = async (params?: ListQueryParams) => {
  const response = await api.get(API_ROUTES.users, {
    params: withDefaultListParams(params)
  });
  return response["data"];
};

export const createUser = async (payload: Record<string, any> | FormData) => {
  const response = await api.post(API_ROUTES.users, payload, payload instanceof FormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : undefined
  );
  toast(response.data.message, "success");
  return response["data"];
};

export const updateUser = async (id: string, payload: Record<string, any> | FormData) => {
  const response = await api.patch(`${API_ROUTES.users}/${id}`, payload, payload instanceof FormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : undefined
  );
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteUser = async (
  id: string,
  options?: { silent?: boolean }
) => {
  const response = await api.delete(`${API_ROUTES.users}/${id}`);
  if (!options?.silent) {
    toast(response.data.message, "success");
  }
  return response["data"];
};

// #endregion

// #region Roles & Permissions

export const getRoles = async (type?: RoleType, params?: ListQueryParams) => {
  const response = await api.get(API_ROUTES.roles, {
    params: withDefaultListParams({
      ...(type ? { type } : {}),
      ...params
    })
  });
  return response["data"];
};

export const createRole = async (payload: { name: string; permissions: string[]; type?: string }) => {
  const response = await api.post(API_ROUTES.roles, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateRole = async (id: string, payload: { name: string; permissions: string[]; type?: string }) => {
  const response = await api.patch(`${API_ROUTES.roles}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteRole = async (
  id: string,
  options?: { silent?: boolean }
) => {
  const response = await api.delete(`${API_ROUTES.roles}/${id}`);
  if (!options?.silent) {
    toast(response.data.message, "success");
  }
  return response["data"];
};

export const getPermissions = async (type?: string, params?: ListQueryParams) => {
  const response = await api.get(API_ROUTES.permissions, {
    params: withDefaultListParams({
      ...(type ? { type } : {}),
      ...params
    })
  });
  return response["data"];
};

// #endregion

// #region Department

export const getDepartments = async (params?: ListQueryParams) => {
  const response = await api.get(API_ROUTES.departments, {
    params: withDefaultListParams(params)
  });
  return response["data"];
};

export const createDepartment = async (payload: Record<string, any>) => {
  const response = await api.post(API_ROUTES.departments, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateDepartment = async (id: string, payload: Record<string, any>) => {
  const response = await api.patch(`${API_ROUTES.departments}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteDepartment = async (
  id: string,
  options?: { silent?: boolean }
) => {
  const response = await api.delete(`${API_ROUTES.departments}/${id}`);
  if (!options?.silent) {
    toast(response.data.message, "success");
  }
  return response["data"];
};

// #endregion

// #region Location 

export const getLocations = async (params?: ListQueryParams) => {
  const response = await api.get(API_ROUTES.locations, {
    params: withDefaultListParams(params)
  });
  return response["data"];
};

export const createLocation = async (payload: Record<string, any>) => {
  const response = await api.post(API_ROUTES.locations, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateLocation = async (id: string, payload: Record<string, any>) => {
  const response = await api.patch(`${API_ROUTES.locations}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteLocation = async (
  id: string,
  options?: { silent?: boolean }
) => {
  const response = await api.delete(`${API_ROUTES.locations}/${id}`);
  if (!options?.silent) {
    toast(response.data.message, "success");
  }
  return response["data"];
};

// #endregion

// #region Designation

export const getDesignations = async (params?: ListQueryParams) => {
  const response = await api.get(API_ROUTES.designations, {
    params: withDefaultListParams(params)
  });
  return response["data"];
};

export const createDesignation = async (payload: Record<string, any>) => {
  const response = await api.post(API_ROUTES.designations, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateDesignation = async (id: string, payload: Record<string, any>) => {
  const response = await api.patch(`${API_ROUTES.designations}/${id}`, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteDesignation = async (
  id: string,
  options?: { silent?: boolean }
) => {
  const response = await api.delete(`${API_ROUTES.designations}/${id}`);
  if (!options?.silent) {
    toast(response.data.message, "success");
  }
  return response["data"];
};

// #endregion
// #region Company

export const getCompany = async () => {
  const response = await api.get(API_ROUTES.company);
  return response["data"];
};

export const updateCompany = async (id: string, payload: FormData) => {
  const response = await api.patch(`${API_ROUTES.company}/${id}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  toast(response.data.message, "success");
  return response.data;
};


// #endregion
