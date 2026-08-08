import inject from "@bentoco/admin-vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import inspect from "vite-plugin-inspect"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  const BASE = env.VITE_MEDUSA_BASE || "/"
  // Empty string = same origin as the Vite page (uses proxy below).
  // Avoids CORS / private-network "Failed to fetch" when UI is on :7001 and API on :9000.
  const BACKEND_URL =
    env.VITE_MEDUSA_BACKEND_URL === undefined
      ? ""
      : env.VITE_MEDUSA_BACKEND_URL
  const API_PROXY_TARGET =
    env.VITE_MEDUSA_PROXY_TARGET || "http://localhost:9000"
  const STOREFRONT_URL =
    env.VITE_MEDUSA_STOREFRONT_URL || "http://localhost:8000"
  const AUTH_TYPE = env.VITE_MEDUSA_AUTH_TYPE || "jwt"
  const JWT_TOKEN_STORAGE_KEY = env.VITE_MEDUSA_JWT_TOKEN_STORAGE_KEY || "bentoco_jwt"
  const MAX_UPLOAD_FILE_SIZE = env.VITE_MEDUSA_MAX_UPLOAD_FILE_SIZE
    ? parseInt(env.VITE_MEDUSA_MAX_UPLOAD_FILE_SIZE, 10)
    : 100 * 1024 * 1024

  /**
   * Add this to your .env file to specify the project to load admin extensions from.
   */
  const MEDUSA_PROJECT = env.VITE_MEDUSA_PROJECT || null
  const sources = MEDUSA_PROJECT ? [MEDUSA_PROJECT] : []

  return {
    plugins: [
      inspect(),
      react(),
      inject({
        sources,
      }),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        { find: "@medusajs/icons", replacement: "@bentoco/icons" },
        { find: "@medusajs/ui", replacement: "@bentoco/ui" },
        { find: "@medusajs/js-sdk", replacement: "@bentoco/js-sdk" },
        { find: "@medusajs/types", replacement: "@bentoco/types" },
        { find: "@medusajs/admin-shared", replacement: "@bentoco/admin-shared" },
        { find: "@medusajs/admin-vite-plugin", replacement: "@bentoco/admin-vite-plugin" },
      ],
    },
    define: {
      __BASE__: JSON.stringify(BASE),
      __BACKEND_URL__: JSON.stringify(BACKEND_URL),
      __STOREFRONT_URL__: JSON.stringify(STOREFRONT_URL),
      __AUTH_TYPE__: JSON.stringify(AUTH_TYPE),
      __JWT_TOKEN_STORAGE_KEY__: JSON.stringify(JWT_TOKEN_STORAGE_KEY),
      __MAX_UPLOAD_FILE_SIZE__: JSON.stringify(MAX_UPLOAD_FILE_SIZE),
    },
    server: {
      host: "0.0.0.0",
      port: 7001,
      cors: true,
      open: false,
      // Browser only talks to :7001; Vite forwards API calls to Medusa :9000
      proxy: {
        "/auth": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
        "/admin": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
        "/api": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
        "/store": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
        "/hooks": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
        "/health": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
  }
})
