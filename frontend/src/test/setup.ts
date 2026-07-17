import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals:false → RTL's automatic cleanup isn't wired up; do it explicitly so
// rendered DOM (incl. portals) doesn't leak between tests.
afterEach(() => cleanup());
