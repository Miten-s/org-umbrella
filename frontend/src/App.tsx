import { Outlet, RouterProvider } from "react-router-dom";
import { Suspense } from "react";
import { createAppRouter } from "./routes/RouteRenderer";
import routes from "./routes";
import { AuthProvider } from "@/context/AuthProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { LoadingSpinner } from "./components/common/Protected";

const AppLoadingFallback = () => <LoadingSpinner />;

// The inner boundary catches page render errors before the router's own default screen does.
const Root = () => (
  <ErrorBoundary>
    <Suspense fallback={<AppLoadingFallback />}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </Suspense>
  </ErrorBoundary>
);

const router = createAppRouter(routes, <Root />);

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
