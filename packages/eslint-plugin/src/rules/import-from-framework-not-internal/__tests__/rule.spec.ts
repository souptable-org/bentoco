import { createRuleTester } from "../../../test-utils"
import { rule } from "../rule"

const ruleTester = createRuleTester()

ruleTester.run("import-from-framework-not-internal", rule, {
  valid: [
    // Canonical framework entry points.
    { code: `import { MedusaError } from "@bentoco/framework/utils"` },
    { code: `import type { Context } from "@bentoco/framework/types"` },
    {
      code: `import { createWorkflow } from "@bentoco/framework/workflows-sdk"`,
    },
    { code: `import { defineMiddlewares } from "@bentoco/framework/http"` },
    // Other public packages are fine.
    { code: `import { deleteOrderWorkflow } from "@bentoco/core-flows"` },
    { code: `import { defineWidgetConfig } from "@bentoco/admin-sdk"` },
    // Unrelated third-party import.
    { code: `import { z } from "zod"` },
    // A @medusajs package whose name merely contains "dist" — not a dist deep import.
    { code: `import x from "@bentoco/some-dist-thing"` },
    // Public subpath that isn't dist.
    { code: `import { Modules } from "@bentoco/framework/utils"` },
  ],
  invalid: [
    // Deprecated standalone package → framework subpath (autofix).
    {
      code: `import { MedusaError } from "@bentoco/utils"`,
      output: `import { MedusaError } from "@bentoco/framework/utils"`,
      errors: [{ messageId: "useFrameworkEntrypoint" }],
    },
    {
      code: `import type { Context } from "@bentoco/types"`,
      output: `import type { Context } from "@bentoco/framework/types"`,
      errors: [{ messageId: "useFrameworkEntrypoint" }],
    },
    {
      code: `import { createWorkflow } from "@bentoco/workflows-sdk"`,
      output: `import { createWorkflow } from "@bentoco/framework/workflows-sdk"`,
      errors: [{ messageId: "useFrameworkEntrypoint" }],
    },
    {
      code: `import { MedusaModule } from "@bentoco/modules-sdk"`,
      output: `import { MedusaModule } from "@bentoco/framework/modules-sdk"`,
      errors: [{ messageId: "useFrameworkEntrypoint" }],
    },
    {
      code: `import { TransactionOrchestrator } from "@bentoco/orchestration"`,
      output: `import { TransactionOrchestrator } from "@bentoco/framework/orchestration"`,
      errors: [{ messageId: "useFrameworkEntrypoint" }],
    },
    // Quote style preserved on autofix.
    {
      code: `import { MedusaError } from '@bentoco/utils'`,
      output: `import { MedusaError } from '@bentoco/framework/utils'`,
      errors: [{ messageId: "useFrameworkEntrypoint" }],
    },
    // Re-export of a deprecated package.
    {
      code: `export { MedusaError } from "@bentoco/utils"`,
      output: `export { MedusaError } from "@bentoco/framework/utils"`,
      errors: [{ messageId: "useFrameworkEntrypoint" }],
    },
    {
      code: `export * from "@bentoco/types"`,
      output: `export * from "@bentoco/framework/types"`,
      errors: [{ messageId: "useFrameworkEntrypoint" }],
    },
    // Deep dist import of the main package → no autofix.
    {
      code: `import { foo } from "@bentoco/medusa/dist/utils/foo"`,
      errors: [{ messageId: "noInternalImport" }],
    },
    // Deep dist import of the framework package → no autofix.
    {
      code: `import { bar } from "@bentoco/framework/dist/utils"`,
      errors: [{ messageId: "noInternalImport" }],
    },
    // dist as the trailing segment.
    {
      code: `import x from "@bentoco/medusa/dist"`,
      errors: [{ messageId: "noInternalImport" }],
    },
    // Nested dist segment.
    {
      code: `import x from "@bentoco/product/dist/services/product"`,
      errors: [{ messageId: "noInternalImport" }],
    },
    // Re-export from internal build output.
    {
      code: `export { x } from "@bentoco/medusa/dist/x"`,
      errors: [{ messageId: "noInternalImport" }],
    },
  ],
})
