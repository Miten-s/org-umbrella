import { defineConfig, devices } from "@playwright/test";

/** E2E suite for the LIMS bug document (bug/LIMS_24_Sept_Updated.docx), cases 1–16.
 * Runs against an already-running stack (frontend + auth/gxp/lims services). */
export default defineConfig({
  testDir: "./e2e",
  // Tests share one database and create real records — keep them sequential.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "lims",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/state.json"
      },
      dependencies: ["setup"]
    }
  ]
});
