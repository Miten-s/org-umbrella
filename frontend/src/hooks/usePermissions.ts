import { useAuth } from "@/context/AuthContext";
import { UserTypes } from "@/utils/common.constants";
import {
  hasPermission,
  hasRole,
  hasAnyRole,
  hasAnyPermission,
  getUserPermissions,
  getUserRoles,
  ROLES,
  ADMIN_PERMISSIONS
} from "@/utils/permissions";

export const usePermissions = () => {
  const { user } = useAuth();

  const can = (permission: string): boolean => {
    return hasPermission(user, permission);
  };

  const canAny = (permissions: string[]): boolean => {
    return hasAnyPermission(user, permissions);
  };

  const hasUserRole = (role: string): boolean => {
    return hasRole(user, role);
  };

  const hasUserAnyRole = (roles: string[]): boolean => {
    return hasAnyRole(user, roles);
  };

  const userPermissions = getUserPermissions(user);
  const userRoles = getUserRoles(user);
  const hasOperateAllPermission = user?.roles?.some((role: any) =>
    role.permissions?.some(
      (perm: any) => perm.name === ADMIN_PERMISSIONS.OPERATE_ALL
    )
  );
  const isSuperAdmin =
    !!hasOperateAllPermission || hasRole(user, ROLES.SUPER_ADMIN);
  const isAdmin =
    isSuperAdmin ||
    hasRole(user, ROLES.ADMIN) ||
    user?.userType === UserTypes.ADMIN;

  return {
    can,
    canAny,
    hasRole: hasUserRole,
    hasAnyRole: hasUserAnyRole,
    userPermissions,
    userRoles,
    isAuthenticated: !!user && Object.keys(user).length > 0,
    isAdmin,
    isSuperAdmin
  };
};

export default usePermissions;
