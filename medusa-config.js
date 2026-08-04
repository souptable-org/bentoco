const { defineConfig, Modules } = require("@bentoco/utils")

module.exports = defineConfig({
  projectConfig: {
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/bentoco_medusa",
    http: {
      jwtSecret: process.env.JWT_SECRET || "supersecret_bentoco_jwt",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret_bentoco_cookie",
      storeCors:
        process.env.STORE_CORS ||
        "http://localhost:8000,http://localhost:3000",
      adminCors:
        process.env.ADMIN_CORS ||
        "http://localhost:7001,http://agency.localhost:7001,http://app.localhost:7001",
      authCors:
        process.env.AUTH_CORS ||
        "http://localhost:7001,http://agency.localhost:7001,http://app.localhost:7001",
    },
  },
  // Admin UI is developed separately via Vite on :7001
  admin: {
    disable: true,
  },
  modules: [
    {
      resolve: "@bentoco/file",
      options: {
        providers: [
          {
            resolve: "@bentoco/file-local",
            id: "local",
            options: {
              upload_dir: "static",
              backend_url: "http://localhost:9000/static",
            },
          },
        ],
      },
    },
  ],
})
