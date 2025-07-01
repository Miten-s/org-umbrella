import { useAuth } from '@/context/AuthContext';
import { 
  hasPermission, 
  hasRole, 
  hasAnyRole, 
  hasAnyPermission,
  getUserPermissions,
  getUserRoles,
  ROLES
} from '@/utils/permissions';

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

  return {
    can,
    canAny,
    hasRole: hasUserRole,
    hasAnyRole: hasUserAnyRole,
    userPermissions,
    userRoles,
    isAuthenticated: !!user && Object.keys(user).length > 0,
    isAdmin: hasRole(user, ROLES.ADMIN) || hasRole(user, ROLES.SUPER_ADMIN),
    isSuperAdmin: hasRole(user, ROLES.SUPER_ADMIN),
  };
};

export default usePermissions; 