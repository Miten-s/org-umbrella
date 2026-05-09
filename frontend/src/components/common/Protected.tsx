import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { SYSTEM_ROUTES } from "@/utils/common.constants";
import { hasPermission } from "@/utils/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const LoadingSpinner = () => {
  const petals = Array.from({ length: 12 });

  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950"
    >
      <div className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <span className="relative h-5 w-5">
          {petals.map((_, index) => (
            <span
              key={index}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `rotate(${index * 30}deg)`
              }}
            >
              <span
                className="block h-[6px] w-[2px] origin-bottom rounded-[1px] bg-gray-700 dark:bg-gray-200"
                style={{
                  transform: "translateY(-9px)",
                  animation: "sunflower-petal 1s ease-in-out infinite",
                  animationDelay: `${index * 0.08}s`
                }}
              />
            </span>
          ))}
        </span>

        <span>Loading...</span>
      </div>

      <style>
        {`
          @keyframes sunflower-petal {
            0% {
              opacity: 1;
              transform: translateY(-9px) scaleY(1.25);
            }
            50% {
              opacity: 0.45;
              transform: translateY(-9px) scaleY(0.8);
            }
            100% {
              opacity: 0.25;
              transform: translateY(-9px) scaleY(0.65);
            }
          }
        `}
      </style>
    </div>
  );
};

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

export default ProtectedRoute;
