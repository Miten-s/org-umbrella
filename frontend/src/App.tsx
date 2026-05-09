import { BrowserRouter as Router } from "react-router-dom";
import { Suspense } from "react";
import RouteRenderer from "./routes/RouteRenderer";
import routes from "./routes";
import { AuthProvider } from "@/context/AuthProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { LoadingSpinner } from "./components/common/Protected";

const AppLoadingFallback = () => (
  <LoadingSpinner />
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<AppLoadingFallback />}>
          <AuthProvider>
            <RouteRenderer routes={routes} />
          </AuthProvider>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
