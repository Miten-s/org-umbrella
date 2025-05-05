import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envPrefix = 'REACT_APP_';
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), envPrefix) };
  const host = process.env.REACT_APP_HOST || 'localhost';
  const port = Number(process.env.REACT_APP_PORT || 3000);

  return {
    plugins: [react(), svgr(),tailwindcss()],
    server: {
      host,
      port,
      strictPort: true, //  exit if port is already in use
      open: true, // automatically open the app in the browser on server start
    },
  }
})

