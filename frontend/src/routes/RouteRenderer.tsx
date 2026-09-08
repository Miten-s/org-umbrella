import { Route, Routes } from "react-router-dom";
import type { AppRoute } from "./types";
import ProtectedRoute from "@/components/common/Protected";

interface Props {
  routes: AppRoute[];
}

const renderRoutes = (routes: AppRoute[]) =>
  routes.map(({ path, element, children, protection, index }) => {
    // For parent routes with children but no element, just render children
    if (!element && children && children.length > 0) {
      return (
        <Route key={path} path={path}>
          {renderRoutes(children)}
        </Route>
      );
    }

    // For routes with element, wrap with protection if specified
    const protectedElement = protection ? (
      <ProtectedRoute
        requiredPermission={protection.requiredPermission}
        requiredRole={protection.requiredRole}
        fallback={protection.fallback}
        redirectTo={protection.redirectTo}
      >
        {element}
      </ProtectedRoute>
    ) : (
      element
    );

    if (index) {
      return <Route key={path} index element={protectedElement} />;
    }

    return (
      <Route key={path} path={path} element={protectedElement}>
        {children && renderRoutes(children)}
      </Route>
    );
  });

const RouteRenderer = ({ routes }: Props) => {
  return <Routes>{renderRoutes(routes)}</Routes>;
};

export default RouteRenderer;
