import api from "../utils/axios.interceptor";

export const API_ROUTES = {
  users: "/auth/users",
  roles: "/roles",  
   permissions: "/permissions"
};

export const createUser = async (payload: Record<string, string>) => {
  const response = await api.post(API_ROUTES.users, payload);
  return response["data"];
};

export const updateUser = async (id: string, payload: Record<string, string>) => {
  const response = await api.patch(API_ROUTES.users + "/" + id, payload);
  return response["data"];
}

export const deleteUser = async (id: string) => {
  const response = await api.delete(API_ROUTES.users + "/" + id);
  return response["data"];
}

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
  return response["data"];};


