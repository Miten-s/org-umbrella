import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  requiredPermission
}: {
  children: React.ReactNode;
  requiredPermission?: string;
}) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return <div className="text-red-500 p-4">Access Denied</div>;
  }

  return children;
};

export default ProtectedRoute;
