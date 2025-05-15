import { toast } from "@/lib/ToastProvider";
import api from "../utils/axios.interceptor";

export const API_ROUTES = {
  users: "/auth/users",
  roles: "/roles",
  permissions: "/permissions",
  login: "/auth/sign-in",
  logout: "/auth/sign-out",
  me: "/auth/me"

};

export const loginUser = async (payload: Record<string, string>) => {
  const response = await api.post(API_ROUTES.login, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const getUserDetail = async () => {
  const response = await api.get(API_ROUTES.me);
  return response["data"];
}

export const logoutUser = async () => {
  const response = await api.post(API_ROUTES.logout);
  return response["data"];
}

export const createUser = async (payload: Record<string, string>) => {
  const response = await api.post(API_ROUTES.users, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const updateUser = async (
  id: string,
  payload: Record<string, string>
) => {
  const response = await api.patch(API_ROUTES.users + "/" + id, payload);
  toast(response.data.message, "success");
  return response["data"];
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(API_ROUTES.users + "/" + id);
  toast(response.data.message, "success");
  return response["data"];
};

export const getUsers = async () => {
  const response = await api.get(API_ROUTES.users);
  return response["data"];
};

export const getRoles = async () => {
  const response = await api.get(API_ROUTES.roles);
  return response["data"];
};

export const getPermissions = async () => {
  const response = await api.get(API_ROUTES.permissions);
  return response["data"];
};

export const createRole = async (payload: { name: string; permissions: string[] }) => {
  const response = await api.post(API_ROUTES.roles, payload);
  return response["data"];
};

export const updateRole = async (id: string, payload: { name: string; permissions: string[] }) => {
  const response = await api.patch(API_ROUTES.roles + "/" + id, payload);
  return response["data"];
};


export const deleteRole = async (id: string) => {
  const response = await api.delete(API_ROUTES.roles + "/" + id);
  return response["data"];
};


