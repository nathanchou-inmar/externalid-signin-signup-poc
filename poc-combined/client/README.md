The /signin page and index.html is created based off HC.Platform - src/Inmar.HC.Platform.AzureADB2C/Assets/.../login.html

Local Variables:
VITE_ENTRA_CLIENT_ID, VITE_ENTRA_TENANT_ID, VITE_ENTRA_AUTHORITY

Setup vite.config.js:
```
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5229",
        changeOrigin: true,
        secure: false
      },
      "/authprofileapi": {
        target: "https://ut-hc-platform-authprofileapi.azurewebsites.net",
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/authprofileapi/, "")
      }
    }
  }
})
```
API proxy to make fetch calls easier, HRD proxy because React blocks these API calls otherwise