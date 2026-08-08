import { createRuleTester } from "../../../test-utils"
import { rule } from "../rule"

const ruleTester = createRuleTester()

ruleTester.run("zod-import-source", rule, {
  valid: [
    // Canonical Medusa import.
    {
      code: `import { z } from "@bentoco/framework/zod"`,
    },
    // Unrelated import.
    {
      code: `import { something } from "other"`,
    },
    // Subpath import — not the bare "zod" package.
    {
      code: `import { z } from "zod/v4"`,
    },
    // Re-export from the Medusa source.
    {
      code: `export { z } from "@bentoco/framework/zod"`,
    },
    // Side-effect import of something else.
    {
      code: `import "polyfill"`,
    },
  ],
  invalid: [
    // Named import.
    {
      code: `import { z } from "zod"`,
      output: `import { z } from "@bentoco/framework/zod"`,
      errors: [{ messageId: "zodImportSource" }],
    },
    // Default-ish namespace import.
    {
      code: `import * as z from "zod"`,
      output: `import * as z from "@bentoco/framework/zod"`,
      errors: [{ messageId: "zodImportSource" }],
    },
    // Single-quoted — quote style preserved.
    {
      code: `import { z } from 'zod'`,
      output: `import { z } from '@bentoco/framework/zod'`,
      errors: [{ messageId: "zodImportSource" }],
    },
    // Side-effect import of bare zod.
    {
      code: `import "zod"`,
      output: `import "@bentoco/framework/zod"`,
      errors: [{ messageId: "zodImportSource" }],
    },
    // Named re-export.
    {
      code: `export { z } from "zod"`,
      output: `export { z } from "@bentoco/framework/zod"`,
      errors: [{ messageId: "zodImportSource" }],
    },
    // Wildcard re-export.
    {
      code: `export * from "zod"`,
      output: `export * from "@bentoco/framework/zod"`,
      errors: [{ messageId: "zodImportSource" }],
    },
  ],
})
