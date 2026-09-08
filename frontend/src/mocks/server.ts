import { setupServer } from "msw/node";
import { limsHandlers } from "./lims/handlers";

/** Node-side mock of lims-service, used by vitest integration tests. */
export const server = setupServer(...limsHandlers);
