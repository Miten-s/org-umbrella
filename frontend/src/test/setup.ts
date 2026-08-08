import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/mocks/server";

// globals:false → RTL's automatic cleanup isn't wired up; do it explicitly so
// rendered DOM (incl. portals) doesn't leak between tests.
afterEach(() => cleanup());

// Mock lims-service for integration tests. `bypass` leaves every other request
// alone, so tests that don't touch LIMS are unaffected.
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
