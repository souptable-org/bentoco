import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@bentoco/framework/http"
import { z } from "@bentoco/framework/zod"

const RadiusStep = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
])

const ThemeOverridesSchema = z
  .object({
    colors: z.record(z.string(), z.string()).optional(),
    colors_dark: z.record(z.string(), z.string()).optional(),
    fonts: z
      .object({
        display: z.string().optional(),
        text: z.string().optional(),
        highlight: z.string().optional(),
        /** Server-hosted custom font files (editor upload) */
        display_url: z.string().optional(),
        text_url: z.string().optional(),
        highlight_url: z.string().optional(),
      })
      .optional(),
    radius_step: RadiusStep.optional(),
  })
  .passthrough()
  .optional()

const PostBody = z.object({
  tenant_id: z.string().optional(),
  install_preset: z.string().optional(),
  theme_id: z.string().optional(),
  design_md: z.string().optional(),
  overrides: ThemeOverridesSchema,
  branding: z
    .object({
      logo_url: z.string().optional(),
      logo_icon_url: z.string().optional(),
      logo_icon_file_name: z.string().optional(),
      wordmark_enabled: z.boolean().optional(),
      wordmark_mode: z.string().optional(),
      wordmark_svg_url: z.string().optional(),
      wordmark_svg_file_name: z.string().optional(),
      wordmark_text: z.string().optional(),
      wordmark_font_family: z.string().optional(),
      wordmark_font_url: z.string().optional(),
      wordmark_font_file_name: z.string().optional(),
      wordmark: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    })
    .passthrough()
    .optional(),
  homepage: z
    .object({
      banners: z
        .array(
          z.object({
            url: z.string(),
            alt: z.string().optional(),
          })
        )
        .optional(),
      promises: z
        .object({
          enabled: z.boolean().optional(),
          items: z
            .array(
              z.object({
                icon: z.string(),
                icon_mode: z.enum(["preset", "custom"]).optional(),
                icon_url: z.string().optional(),
                icon_file_name: z.string().optional(),
                text: z.string().max(48),
              })
            )
            .max(4)
            .optional(),
        })
        .optional(),
      category_sections: z
        .array(
          z.object({
            title: z.string(),
            source: z.enum(["category", "manual", "offer"]).optional(),
            category_id: z.string().optional(),
            promotion_id: z.string().optional(),
            product_ids: z.array(z.string()).optional(),
            limit: z.number().int().min(1).max(48).optional(),
            sort: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
})

export const adminStoreThemeMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/store-theme",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/admin/store-theme",
    middlewares: [validateAndTransformBody(PostBody)],
  },
]
