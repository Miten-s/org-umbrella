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

  // Same paths nginx forwards in prod (nginx/app.conf) — only /<service>/v1/api and
  // /<service>/uploads. A bare "/lims" or "/gxp" key also caught page URLs like /lims/samples
  // and /gxp-service/..., so reloading those pages hit the API ("Cannot GET").
  const services = {
    auth: process.env.REACT_APP_AUTH_PORT || 9001,
    gxp: process.env.REACT_APP_GXP_PORT || 9002,
    lims: process.env.REACT_APP_LIMS_PORT || 9003,
  };
  const proxy = Object.fromEntries(
    Object.entries(services).flatMap(([service, servicePort]) =>
      ['v1/api', 'uploads'].map((suffix) => [
        `/${service}/${suffix}`,
        {
          target: `http://localhost:${servicePort}`,
          changeOrigin: true,
          rewrite: (p: string) => p.replace(new RegExp(`^/${service}`), ''),
        },
      ])
    )
  );

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
      proxy,
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
