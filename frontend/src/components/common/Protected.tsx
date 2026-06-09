import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { SYSTEM_ROUTES } from "@/utils/common.constants";
import { hasPermission } from "@/utils/permissions";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="text-red-500 text-xl font-semibold mb-2">Access Denied</div>
    <div className="text-gray-600 mb-4">
      You don't have permission to access this page
    </div>
    <button
      onClick={() => window.history.back()}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Go Back
    </button>
  </div>
);

const ProtectedRoute = ({
  children,
  requiredPermission,
  requiredRole,
  fallback = <LoadingSpinner />,
  redirectTo = SYSTEM_ROUTES.LOGIN
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being determined
  if (isLoading) {
    return fallback;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user || Object.keys(user).length === 0) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check for required permission
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <AccessDenied />;
  }

  // Check for required role
  if (requiredRole) {
    const userRoles = user.roles?.map((role: any) => role.name) || [];
    if (!userRoles.includes(requiredRole)) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
};

export { LoadingSpinner };
export default ProtectedRoute;
