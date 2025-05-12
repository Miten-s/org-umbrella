import { BrowserRouter as Router } from "react-router-dom";
import { Suspense } from "react";
import RouteRenderer from "./routes/RouteRenderer";
import routes from "./routes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <AuthProvider>
          <RouteRenderer routes={routes} />
        </AuthProvider>
      </Suspense>
    </Router>
  );
}

export default App;
