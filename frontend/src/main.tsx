// main.tsx
import ReactDOM from "react-dom/client";
import App from "./App";
import { GlobalContextProvider } from "./context/GlobalContextProvider";
import "./index.css";
import { ThemeProvider } from "./context/ThemeProvider";
import ToastProvider from "./lib/ToastProvider";
import "./i18n";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query/queryClient";

const render = () =>
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <I18nextProvider i18n={i18n}>
              <GlobalContextProvider>
                <App />
              </GlobalContextProvider>
            </I18nextProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );

/**
 * lims-service does not exist yet, so LIMS calls can be served by an in-browser
 * mock while the backend is built. Dev-only and opt-in via
 * `VITE_ENABLE_LIMS_MOCKS=true`; everything else passes through untouched.
 * Remove this block (and src/mocks/) once the real service is up.
 */
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LIMS_MOCKS === "true") {
  import("./mocks/browser")
    .then(({ startLimsMocks }) => startLimsMocks())
    .catch(() => undefined)
    .finally(render);
} else {
  render();
}
