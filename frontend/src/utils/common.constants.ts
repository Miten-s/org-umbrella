export const SYSTEM_ROUTES = {
  HOME: "/",
  LOGIN: "/sign-in",
  DASHBOARD: "/dashboard"
}

export const AUTH_TOKEN_KEY = "auth_access_token";

export const MESSAGES = {
  SUCCESS: {
    ENTITY_ADDED: "Successfully added {{ entity }}",
    ENTITY_UPDATED: "Successfully updated {{ entity }}",
    ENTITY_DELETED: "Successfully deleted {{ entity }}",
  },
  ERROR: {
    ENTITY_NOT_FOUND: "{{ entity }} not found",
  }
}


export const UserTypes = {
  ADMIN: "Admin",
  USER: "User",
}

export enum RoleType {
  CUSTOM = "Custom",
  BUILT_IN = "Built_In",
  GXP_SERVICE = "Gxp_Service"
}

export enum PermissionType {
  DEFAULT = "default",
  GXP_SERVICE = "gxp_service"
}
