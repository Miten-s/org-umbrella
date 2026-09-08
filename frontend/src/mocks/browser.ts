import { setupWorker } from "msw/browser";
import { limsHandlers } from "./lims/handlers";

/**
 * Dev-only mock of lims-service. Started from `main.tsx` when
 * `VITE_ENABLE_LIMS_MOCKS=true`, so it can never reach production.
 *
 * `onUnhandledRequest: "bypass"` means only LIMS calls are intercepted — the
 * real auth backend and gxp-service are untouched.
 */
export const worker = setupWorker(...limsHandlers);

export const startLimsMocks = () =>
  worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
    serviceWorker: { url: "/mockServiceWorker.js" }
  });
