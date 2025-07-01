export const PERMISSIONS = {
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

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER"
};

export const hasPermission = (user: any, permission: string): boolean => {
  if (!user || !user.roles) return false;
  const permissions = user.roles
    ?.flatMap((role: any) => role.permissions)
    .map((permission: any) => permission.name);
  return (
    permissions?.includes(permission) ||
    permissions?.includes(PERMISSIONS.OPERATE_ALL)
  );
};

export const hasRole = (user: any, role: string): boolean => {
  if (!user || !user.roles) return false;

  const userRoles = user.roles.map((role: any) => role.name);
  return userRoles.includes(role);
};

export const hasAnyRole = (user: any, roles: string[]): boolean => {
  if (!user || !user.roles) return false;

  const userRoles = user.roles.map((role: any) => role.name);
  return roles.some(role => userRoles.includes(role));
};

export const hasAnyPermission = (user: any, permissions: string[]): boolean => {
  if (!user || !user.roles) return false;

  const userPermissions = user.roles
    ?.flatMap((role: any) => role.permissions)
    .map((permission: any) => permission.name);
  const hasPermission = permissions.some(permission =>
    userPermissions?.includes(permission) ||
    userPermissions?.includes(PERMISSIONS.OPERATE_ALL)
  );
  return hasPermission;
};

export const getUserPermissions = (user: any): string[] => {
  if (!user || !user.roles) return [];

  return user.roles
    .flatMap((role: any) => role.permissions)
    .map((permission: any) => permission.name);
};

export const getUserRoles = (user: any): string[] => {
  if (!user || !user.roles) return [];

  return user.roles.map((role: any) => role.name);
};
