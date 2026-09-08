import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // svgr mirrors vite.config.ts so `*.svg?react` icon imports resolve in tests too
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent"
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["src/test/setup.ts"]
  }
});
