import { Route, Routes } from 'react-router-dom';
import type { AppRoute } from './types';
import ProtectedRoute from '@/components/common/Protected';

interface Props {
  routes: AppRoute[];
}

const renderRoutes = (routes: AppRoute[]) =>
  routes.map(({ path, element, children, protection }) => {
    // Wrap element with protection if specified
    const protectedElement = protection ? (
      <ProtectedRoute
        requiredPermission={protection.requiredPermission}
        requiredRole={protection.requiredRole}
        fallback={protection.fallback}
        redirectTo={protection.redirectTo}
      >
        {element}
      </ProtectedRoute>
    ) : element;

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
