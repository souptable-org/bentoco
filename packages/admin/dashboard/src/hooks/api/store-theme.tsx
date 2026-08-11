import {
  QueryKey,
  useMutation,
  useQuery,
  UseQueryOptions,
  MutationOptions,
} from "@tanstack/react-query"
import { FetchError } from "@bentoco/js-sdk"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export type StoreThemeConfig = {
  schema_version?: number
  active_theme_id: string
  layout_id?: string
  design_md: string
  tokens: {
    name: string
    description?: string
    colors?: Record<string, string>
    typography?: Record<string, { fontFamily?: string }>
    rounded?: Record<string, string>
  }
  overrides?: {
    colors?: Record<string, string>
    colors_dark?: Record<string, string>
    fonts?: {
      display?: string
      text?: string
      highlight?: string
      display_url?: string
      text_url?: string
      highlight_url?: string
    }
    radius_step?: 0 | 1 | 2 | 3 | 4
  }
  branding?: {
    logo_icon_url?: string
    logo_icon_file_name?: string
    logo_url?: string
    wordmark_enabled?: boolean
    wordmark_mode?: "svg" | "font"
    wordmark_svg_url?: string
    wordmark_svg_file_name?: string
    wordmark_text?: string
    wordmark_font_family?: string
    wordmark_font_url?: string
    wordmark_font_file_name?: string
    wordmark?: string | { type: string; value: string }
  }
  homepage?: {
    banners?: { url: string; alt?: string }[]
    promises?: {
      enabled?: boolean
      items?: Array<{
        icon: string
        icon_mode?: "preset" | "custom"
        icon_url?: string
        icon_file_name?: string
        text: string
      }>
    }
    category_sections?: {
      title: string
      source?: "category" | "manual" | "offer"
      category_id?: string
      promotion_id?: string
      product_ids?: string[]
      limit?: number
      sort: number
    }[]
  }
  published_at?: string
  published?: any
  draft?: any
  history?: any[]
}

export type StoreThemeResponse = {
  tenant_id: string
  theme_config: StoreThemeConfig
  css: string
  font_stylesheet_url: string | null
  variables?: Record<string, string>
  presets?: Array<{ id: string; name: string }>
}

export type StoreThemeUpdateBody = {
  tenant_id?: string
  install_preset?: string
  theme_id?: string
  design_md?: string
  overrides?: StoreThemeConfig["overrides"]
  branding?: StoreThemeConfig["branding"]
  homepage?: StoreThemeConfig["homepage"]
}

const STORE_THEME_QUERY_KEY = "store-theme" as const
export const storeThemeQueryKeys = queryKeysFactory(STORE_THEME_QUERY_KEY)

export const useStoreTheme = (
  options?: Omit<
    UseQueryOptions<
      StoreThemeResponse,
      FetchError,
      StoreThemeResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: storeThemeQueryKeys.details(),
    queryFn: async () => {
      return await sdk.client.fetch<StoreThemeResponse>("/admin/store-theme")
    },
    ...options,
  })

  return { theme: data, ...rest }
}

export const useUpdateStoreTheme = (
  options?: MutationOptions<
    StoreThemeResponse,
    FetchError,
    StoreThemeUpdateBody
  >
) => {
  return useMutation({
    mutationFn: async (body: StoreThemeUpdateBody) => {
      return await sdk.client.fetch<StoreThemeResponse>("/admin/store-theme", {
        method: "POST",
        body,
      })
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: storeThemeQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const usePublishStoreTheme = (
  options?: MutationOptions<
    StoreThemeResponse,
    FetchError,
    { tenant_id?: string } | void
  >
) => {
  return useMutation({
    mutationFn: async (body?: { tenant_id?: string }) => {
      return await sdk.client.fetch<StoreThemeResponse>(
        "/admin/store-theme/publish",
        {
          method: "POST",
          body: body || {},
        }
      )
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: storeThemeQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDiscardStoreThemeDraft = (
  options?: MutationOptions<
    StoreThemeResponse,
    FetchError,
    { tenant_id?: string } | void
  >
) => {
  return useMutation({
    mutationFn: async (body?: { tenant_id?: string }) => {
      return await sdk.client.fetch<StoreThemeResponse>(
        "/admin/store-theme/discard",
        {
          method: "POST",
          body: body || {},
        }
      )
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: storeThemeQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRollbackStoreTheme = (
  options?: MutationOptions<
    StoreThemeResponse,
    FetchError,
    { tenant_id?: string } | void
  >
) => {
  return useMutation({
    mutationFn: async (body?: { tenant_id?: string }) => {
      return await sdk.client.fetch<StoreThemeResponse>(
        "/admin/store-theme/rollback",
        {
          method: "POST",
          body: body || {},
        }
      )
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: storeThemeQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
