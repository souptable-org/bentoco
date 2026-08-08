import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    // `@bentoco/dashboard`
    app: "./src/app.tsx",
    // `@bentoco/dashboard/components`
    components: "./src/exports/components.tsx",
    // `@bentoco/dashboard/hooks`
    hooks: "./src/exports/hooks.ts",
    // `@bentoco/dashboard/lib`
    lib: "./src/exports/lib.ts",
  },
  format: ["cjs", "esm"],
  external: [
    "virtual:medusa/forms",
    "virtual:medusa/displays",
    "virtual:medusa/routes",
    "virtual:medusa/links",
    "virtual:medusa/menu-items",
    "virtual:medusa/widgets",
    "virtual:medusa/i18n",
    "virtual:medusa/cell-renderers",
    "virtual:medusa/layouts",
  ],
  tsconfig: "tsconfig.build.json",
  dts: {
    entry: {
      index: "./src/index.ts",
      components: "./src/exports/components.tsx",
      hooks: "./src/exports/hooks.ts",
      lib: "./src/exports/lib.ts",
    },
  },
  clean: true,
})
