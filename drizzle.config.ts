import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/bentoco/src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/bentoco",
  },
});
