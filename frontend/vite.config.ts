import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envPrefix = 'REACT_APP_';
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), envPrefix) };
  const host = process.env.REACT_APP_HOST || 'localhost';
  const port = Number(process.env.REACT_APP_PORT || 3000);

  return {
    plugins: [react(), svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),tailwindcss()],
    server: {
      host,
      port,
      strictPort: true, //  exit if port is already in use
      open: true, // automatically open the app in the browser on server start
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }

            if (id.includes("ag-grid-community") || id.includes("ag-grid-react")) {
              return "ag-grid";
            }

            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom") ||
              id.includes("@reduxjs/toolkit") ||
              id.includes("react-redux")
            ) {
              return "react-vendor";
            }

            if (
              id.includes("react-hook-form") ||
              id.includes("@hookform") ||
              id.includes("zod")
            ) {
              return "form-vendor";
            }

            if (id.includes("i18next") || id.includes("react-i18next")) {
              return "i18n-vendor";
            }

            return undefined;
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '/public': path.resolve(__dirname, 'public'), // For public alias (optional)
      },
    },
  }
})
