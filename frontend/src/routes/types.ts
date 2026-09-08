import { ReactNode } from "react";

export interface RouteProtection {
  required?: boolean;
  requiredPermission?: string;
  requiredRole?: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export interface AppRoute {
  path: string;
  element?: ReactNode; // Optional for parent routes with children
  index?: boolean; // Support for index routes
  children?: AppRoute[];
  protection?: RouteProtection;
  meta?: {
    title?: string;
    icon?: string;
    breadcrumb?: string;
    hideFromMenu?: boolean;
    order?: number;
  };
}

export interface ProtectedRouteConfig {
  path: string;
  element: ReactNode;
  protection: RouteProtection;
  children?: ProtectedRouteConfig[];
  meta?: AppRoute["meta"];
}

export interface PublicRouteConfig {
  path: string;
  element: ReactNode;
  children?: PublicRouteConfig[];
  meta?: AppRoute["meta"];
}
