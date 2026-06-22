import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // login.html is served at "/" (the home screen)
        main: resolve(__dirname, 'index.html'),
        // the React app keeps its own entry at "/app.html"
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
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
