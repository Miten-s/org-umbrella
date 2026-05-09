export const ADMIN_PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: "VIEW:DASHBOARD",

  // Permission Management
  CREATE_PERMISSION: "CREATE:PERMISSION",
  VIEW_PERMISSION: "VIEW:PERMISSION",
  UPDATE_PERMISSION: "UPDATE:PERMISSION",
  DELETE_PERMISSION: "DELETE:PERMISSION",

  // Role Management
  CREATE_ROLE: "CREATE:ROLE",
  VIEW_ROLE: "VIEW:ROLE",
  UPDATE_ROLE: "UPDATE:ROLE",
  DELETE_ROLE: "DELETE:ROLE",

  // User Management
  CREATE_USER: "CREATE:USER",
  VIEW_USER: "VIEW:USER",
  UPDATE_USER: "UPDATE:USER",
  DELETE_USER: "DELETE:USER",

  // Department Management
  CREATE_DEPARTMENT: "CREATE:DEPARTMENT",
  VIEW_DEPARTMENT: "VIEW:DEPARTMENT",
  UPDATE_DEPARTMENT: "UPDATE:DEPARTMENT",
  DELETE_DEPARTMENT: "DELETE:DEPARTMENT",

  // Designation Management
  CREATE_DESIGNATION: "CREATE:DESIGNATION",
  VIEW_DESIGNATION: "VIEW:DESIGNATION",
  UPDATE_DESIGNATION: "UPDATE:DESIGNATION",
  DELETE_DESIGNATION: "DELETE:DESIGNATION",

  // Location Management
  CREATE_LOCATION: "CREATE:LOCATION",
  VIEW_LOCATION: "VIEW:LOCATION",
  UPDATE_LOCATION: "UPDATE:LOCATION",
  DELETE_LOCATION: "DELETE:LOCATION",

  // Admin permissions
  OPERATE_ALL: "OPERATE:ALL"
};

export const GXP_PERMISSIONS = {
  CREATE_PERMISSION: "GXP:CREATE:PERMISSION",
  VIEW_PERMISSION: "GXP:VIEW:PERMISSION",
  UPDATE_PERMISSION: "GXP:UPDATE:PERMISSION",
  DELETE_PERMISSION: "GXP:DELETE:PERMISSION",

  CREATE_ROLE: "GXP:CREATE:ROLE",
  VIEW_ROLE: "GXP:VIEW:ROLE",
  UPDATE_ROLE: "GXP:UPDATE:ROLE",
  DELETE_ROLE: "GXP:DELETE:ROLE",

  CREATE_USER: "GXP:CREATE:USER",
  VIEW_USER: "GXP:VIEW:USER",
  UPDATE_USER: "GXP:UPDATE:USER",
  DELETE_USER: "GXP:DELETE:USER",

  CREATE_ASSIGNMENT_GROUP: "GXP:CREATE:ASSIGNMENT_GROUP",
  VIEW_ASSIGNMENT_GROUP: "GXP:VIEW:ASSIGNMENT_GROUP",
  UPDATE_ASSIGNMENT_GROUP: "GXP:UPDATE:ASSIGNMENT_GROUP",
  DELETE_ASSIGNMENT_GROUP: "GXP:DELETE:ASSIGNMENT_GROUP",

  CREATE_WORKFLOW: "GXP:CREATE:WORKFLOW",
  VIEW_WORKFLOW: "GXP:VIEW:WORKFLOW",
  UPDATE_WORKFLOW: "GXP:UPDATE:WORKFLOW",
  DELETE_WORKFLOW: "GXP:DELETE:WORKFLOW",

  CREATE_ENVIRONMENT: "GXP:CREATE:ENVIRONMENT",
  VIEW_ENVIRONMENT: "GXP:VIEW:ENVIRONMENT",
  UPDATE_ENVIRONMENT: "GXP:UPDATE:ENVIRONMENT",
  DELETE_ENVIRONMENT: "GXP:DELETE:ENVIRONMENT",

  CREATE_SUPPLIERS: "GXP:CREATE:SUPPLIERS",
  VIEW_SUPPLIERS: "GXP:VIEW:SUPPLIERS",
  UPDATE_SUPPLIERS: "GXP:UPDATE:SUPPLIERS",
  DELETE_SUPPLIERS: "GXP:DELETE:SUPPLIERS",

  CREATE_SOFTWARE_MODULES: "GXP:CREATE:SOFTWARE_MODULES",
  VIEW_SOFTWARE_MODULES: "GXP:VIEW:SOFTWARE_MODULES",
  UPDATE_SOFTWARE_MODULES: "GXP:UPDATE:SOFTWARE_MODULES",
  DELETE_SOFTWARE_MODULES: "GXP:DELETE:SOFTWARE_MODULES",

  CREATE_SOFTWARE: "GXP:CREATE:SOFTWARE",
  VIEW_SOFTWARE: "GXP:VIEW:SOFTWARE",
  UPDATE_SOFTWARE: "GXP:UPDATE:SOFTWARE",
  DELETE_SOFTWARE: "GXP:DELETE:SOFTWARE",

  CREATE_SERVICE_REQUEST: "GXP:CREATE:SERVICE_REQUEST",
  VIEW_SERVICE_REQUEST: "GXP:VIEW:SERVICE_REQUEST",
  UPDATE_SERVICE_REQUEST: "GXP:UPDATE:SERVICE_REQUEST",
  DELETE_SERVICE_REQUEST: "GXP:DELETE:SERVICE_REQUEST"
};

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER"
};

const getRoles = (user?: AuthenticatedUser | null): UserRole[] => {
  if (!user || !user.roles) return [];

  return user.roles;
};

const getPermissions = (user?: AuthenticatedUser | null): string[] =>
  getRoles(user)
    .flatMap((role) => role.permissions ?? [])
    .map((permission) => permission.name);

export const hasPermission = (
  user: AuthenticatedUser | null | undefined,
  permission: string
): boolean => {
  const permissions = getPermissions(user);
  return (
    permissions?.includes(permission) ||
    permissions?.includes(ADMIN_PERMISSIONS.OPERATE_ALL)
  );
};

export const hasRole = (
  user: AuthenticatedUser | null | undefined,
  role: string
): boolean => {
  const userRoles = getRoles(user).map((role) => role.name);
  return userRoles.includes(role);
};

export const hasAnyRole = (
  user: AuthenticatedUser | null | undefined,
  roles: string[]
): boolean => {
  const userRoles = getRoles(user).map((role) => role.name);
  return roles.some((role) => userRoles.includes(role));
};

export const hasAnyPermission = (
  user: AuthenticatedUser | null | undefined,
  permissions: string[]
): boolean => {
  const userPermissions = getPermissions(user);
  const hasPermission = permissions.some(
    (permission) =>
      userPermissions?.includes(permission) ||
      userPermissions?.includes(ADMIN_PERMISSIONS.OPERATE_ALL)
  );
  return hasPermission;
};

export const getUserPermissions = (
  user: AuthenticatedUser | null | undefined
): string[] => {
  return getPermissions(user);
};

export const getUserRoles = (
  user: AuthenticatedUser | null | undefined
): string[] => {
  return getRoles(user).map((role) => role.name);
};
import type { AuthenticatedUser, UserRole } from "@/types/common.types";
