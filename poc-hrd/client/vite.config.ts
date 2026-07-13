import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/authprofileapi": {
        target: "https://ut-hc-platform-authprofileapi.azurewebsites.net",
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/authprofileapi/, "")
      }
    }
  }
})
