import { Route, Routes } from 'react-router-dom';
import type { AppRoute } from './types';

interface Props {
  routes: AppRoute[];
}

const renderRoutes = (routes: AppRoute[]) =>
  routes.map(({ path, element, children }) => (
    <Route key={path} path={path} element={element}>
      {children && renderRoutes(children)}
    </Route>
  ));

const RouteRenderer = ({ routes }: Props) => {
  return <Routes>{renderRoutes(routes)}</Routes>;
};

export default RouteRenderer;
