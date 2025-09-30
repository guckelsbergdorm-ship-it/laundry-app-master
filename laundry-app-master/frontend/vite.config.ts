import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginSvgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginSvgr()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
    }
  },
  preview: {
    allowedHosts: ['unique-abundance-frontend.up.railway.app', '.railway.app']
  }
})
