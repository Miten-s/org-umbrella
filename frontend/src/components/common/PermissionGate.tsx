import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  fallback?: ReactNode;
}

const PermissionGate = ({
  children,
  permission,
  permissions,
  role,
  roles,
  fallback = null
}: PermissionGateProps) => {
  const { can, canAny, hasRole, hasAnyRole } = usePermissions();

  // Check single permission
  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions (ANY)
  if (permissions && permissions.length > 0 && !canAny(permissions)) {
    return <>{fallback}</>;
  }

  // Check single role
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Check multiple roles (ANY)
  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
