import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Button,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  clx,
  toast,
} from "@bentoco/ui"
import { sdk } from "../../../lib/client"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover"
import {
  ArrowPath,
  ArrowUturnLeft,
  ArrowUpTray,
  BuildingStorefront,
  CheckCircleSolid,
  ComputerDesktop,
  InformationCircle,
  Phone,
  PhotoSolid,
  ShieldCheck,
  Swatch,
  Tablet,
  TagSolid,
  XMarkMini,
} from "@bentoco/icons"
import {
  useStoreTheme,
  useUpdateStoreTheme,
  usePublishStoreTheme,
  useDiscardStoreThemeDraft,
  useRollbackStoreTheme,
  type StoreThemeConfig,
} from "../../../hooks/api/store-theme"
import {
  GoogleFontPicker,
  type FontRoleValue,
} from "./google-font-picker"
import {
  CategoriesInspector,
  normalizeCategorySections,
  serializeCategorySections,
  type DraftCategorySection,
} from "./category-sections-inspector"
import {
  PromisesInspector,
  normalizePromises,
  serializePromises,
  type DraftPromises,
} from "./promises-inspector"
import {
  storefrontPreviewUrl,
  normalizePreviewPath,
} from "../../../lib/storefront-preview"

type EditorSection =
  | "radius"
  | "fonts"
  | "colours"
  | "logo"
  | "banners"
  | "promises"
  | "categories"

type DraftFonts = {
  display: FontRoleValue
  text: FontRoleValue
  highlight: FontRoleValue
}

type WordmarkMode = "svg" | "font"

type DraftLogo = {
  icon_url: string
  icon_file_name?: string
  wordmark_enabled: boolean
  wordmark_mode: WordmarkMode
  wordmark_svg_url: string
  wordmark_svg_file_name?: string
  wordmark_text: string
  wordmark_font: FontRoleValue
}

type DraftState = {
  radius_step: 0 | 1 | 2 | 3 | 4
  fonts: DraftFonts
  /** Light mode colors */
  colors: Record<string, string>
  /** Dark mode colors */
  colors_dark: Record<string, string>
  selectedPaletteId: string
  selectedPaletteIdDark: string
  logo: DraftLogo
  banners: { url: string; alt?: string }[]
  promises: DraftPromises
  category_sections: DraftCategorySection[]
}

function roleFromSaved(
  family: string | undefined,
  url: string | undefined,
  fallback: string
): FontRoleValue {
  const fam = family || fallback
  if (url) {
    // URL is the server-hosted file after upload (not a user-pasted link)
    const file_name = url.split("/").pop()?.split("?")[0]
    return { family: fam, url, file_name, mode: "custom" }
  }
  return { family: fam, mode: "google" }
}

const SECTIONS: Array<{
  id: EditorSection
  label: string
  hint: string
}> = [
  { id: "radius", label: "Radius", hint: "Corner style" },
  { id: "fonts", label: "Fonts", hint: "Type roles" },
  { id: "colours", label: "Colours", hint: "Palette" },
  { id: "logo", label: "Logo", hint: "Brand mark" },
  { id: "banners", label: "Banners", hint: "Homepage" },
  { id: "promises", label: "Promises", hint: "Under hero" },
  { id: "categories", label: "Categories", hint: "Homepage" },
]

const RADIUS_LABELS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "Sharp",
  1: "Subtle",
  2: "Default",
  3: "Soft",
  4: "Bubbly",
}

const COLOR_KEYS = [
  "background",
  "foreground",
  "primary",
  "accent",
  "muted",
  "muted-foreground",
  "card",
  "border",
  "secondary",
] as const

type PaletteColors = Partial<Record<(typeof COLOR_KEYS)[number], string>>

const PRIMARY_PALETTES: Array<{
  id: string
  label: string
  /** Light mode swatch set */
  light: PaletteColors
  /** Dark mode swatch set */
  dark: PaletteColors
}> = [
  {
    id: "warm-minimalist",
    label: "Warm Minimalist",
    light: {
      background: "#F7F5F2",
      foreground: "#1A1C1E",
      primary: "#1A1C1E",
      accent: "#B8422E",
      muted: "#EDE9E3",
      "muted-foreground": "#6C7278",
      card: "#FFFFFF",
      border: "#E4DFD7",
      secondary: "#EDE9E3",
    },
    dark: {
      background: "#141210",
      foreground: "#F5F2ED",
      primary: "#F5F2ED",
      accent: "#E07A66",
      muted: "#2A2622",
      "muted-foreground": "#A39E96",
      card: "#1C1916",
      border: "#3A342E",
      secondary: "#2A2622",
    },
  },
  {
    id: "ink-slate",
    label: "Ink Slate",
    light: {
      background: "#F4F6F8",
      foreground: "#0B0F14",
      primary: "#0B0F14",
      accent: "#0284C7",
      muted: "#E2E8F0",
      "muted-foreground": "#64748B",
      card: "#FFFFFF",
      border: "#CBD5E1",
      secondary: "#E2E8F0",
    },
    dark: {
      background: "#0B0F14",
      foreground: "#F3F4F6",
      primary: "#F3F4F6",
      accent: "#38BDF8",
      muted: "#1F2937",
      "muted-foreground": "#9CA3AF",
      card: "#111827",
      border: "#374151",
      secondary: "#1F2937",
    },
  },
  {
    id: "forest",
    label: "Forest",
    light: {
      background: "#F4F7F4",
      foreground: "#14201A",
      primary: "#14201A",
      accent: "#2F6F4E",
      muted: "#E2EBE4",
      "muted-foreground": "#5B6B61",
      card: "#FFFFFF",
      border: "#D0DCD4",
      secondary: "#E2EBE4",
    },
    dark: {
      background: "#0C1410",
      foreground: "#E8F0EA",
      primary: "#E8F0EA",
      accent: "#4ADE80",
      muted: "#1A2920",
      "muted-foreground": "#8FA396",
      card: "#121C16",
      border: "#2A3D30",
      secondary: "#1A2920",
    },
  },
]

type PreviewDevice = "desktop" | "tablet" | "phone"

const PREVIEW_DEVICE: Record<
  PreviewDevice,
  { label: string; width: string | number; maxWidth: string }
> = {
  desktop: { label: "Desktop", width: "100%", maxWidth: "100%" },
  tablet: { label: "Tablet", width: 768, maxWidth: "100%" },
  phone: { label: "Phone", width: 390, maxWidth: "100%" },
}

function matchPaletteId(
  colors: Record<string, string>,
  mode: "light" | "dark"
): string {
  for (const p of PRIMARY_PALETTES) {
    const preset = mode === "light" ? p.light : p.dark
    const keys = ["background", "foreground", "accent"] as const
    const match = keys.every(
      (k) =>
        normalizeHex(colors[k]).toLowerCase() ===
        normalizeHex(preset[k] || "").toLowerCase()
    )
    if (match) return p.id
  }
  return "custom"
}

function draftFromConfig(config?: StoreThemeConfig | null): DraftState {
  const source = config?.draft || config
  const o = source?.overrides
  const branding = source?.branding || config?.branding
  const homepage = source?.homepage || config?.homepage

  const colors: Record<string, string> = {}
  const colors_dark: Record<string, string> = {}
  for (const k of COLOR_KEYS) {
    colors[k] =
      o?.colors?.[k] ||
      config?.tokens?.colors?.[k] ||
      PRIMARY_PALETTES[0].light[k] ||
      "#888888"
    colors_dark[k] =
      o?.colors_dark?.[k] || PRIMARY_PALETTES[0].dark[k] || "#888888"
  }
  return {
    radius_step: (o?.radius_step ?? 2) as 0 | 1 | 2 | 3 | 4,
    fonts: {
      display: roleFromSaved(
        o?.fonts?.display || config?.tokens?.typography?.display?.fontFamily,
        o?.fonts?.display_url,
        "DM Sans"
      ),
      text: roleFromSaved(
        o?.fonts?.text ||
          config?.tokens?.typography?.body?.fontFamily ||
          config?.tokens?.typography?.["body-md"]?.fontFamily,
        o?.fonts?.text_url,
        "DM Sans"
      ),
      highlight: roleFromSaved(
        o?.fonts?.highlight ||
          config?.tokens?.typography?.highlight?.fontFamily,
        o?.fonts?.highlight_url,
        "DM Sans"
      ),
    },
    colors,
    colors_dark,
    selectedPaletteId: matchPaletteId(colors, "light"),
    selectedPaletteIdDark: matchPaletteId(colors_dark, "dark"),
    logo: brandingToDraftLogo(branding),
    banners: homepage?.banners?.length
      ? [...homepage.banners]
      : [],
    promises: normalizePromises(homepage?.promises),
    category_sections: normalizeCategorySections(
      homepage?.category_sections
    ),
  }
}

function brandingToDraftLogo(
  branding?: StoreThemeConfig["branding"]
): DraftLogo {
  const b = branding || {}
  const icon_url = b.logo_icon_url || b.logo_url || ""
  const wordmark_enabled = b.wordmark_enabled !== false

  // Preserve mode even when the switch is off so the section can stay
  // visible in a disabled look (instead of collapsing to empty).
  const rawMode = b.wordmark_mode
  const wordmark_mode: WordmarkMode =
    rawMode === "svg" || rawMode === "font"
      ? rawMode
      : b.wordmark_svg_url
        ? "svg"
        : "font"

  const legacyText =
    typeof b.wordmark === "string"
      ? b.wordmark
      : b.wordmark?.type === "text"
        ? b.wordmark.value
        : ""

  return {
    icon_url,
    icon_file_name: b.logo_icon_file_name,
    wordmark_enabled,
    wordmark_mode,
    wordmark_svg_url: b.wordmark_svg_url || "",
    wordmark_svg_file_name: b.wordmark_svg_file_name,
    wordmark_text: b.wordmark_text || legacyText || "",
    wordmark_font: roleFromSaved(
      b.wordmark_font_family,
      b.wordmark_font_url,
      "DM Sans"
    ),
  }
}

function draftLogoToBranding(logo: DraftLogo): StoreThemeConfig["branding"] {
  // Draft fields stay persisted when the switch is off so settings survive a toggle.
  const active = logo.wordmark_enabled
  return {
    logo_icon_url: logo.icon_url || undefined,
    logo_icon_file_name: logo.icon_file_name,
    logo_url: logo.icon_url || undefined,
    wordmark_enabled: logo.wordmark_enabled,
    wordmark_mode: logo.wordmark_mode,
    // Keep draft assets even when disabled so re-enabling restores them
    wordmark_svg_url: logo.wordmark_svg_url || undefined,
    wordmark_svg_file_name: logo.wordmark_svg_file_name,
    wordmark_text: logo.wordmark_text || undefined,
    wordmark_font_family: logo.wordmark_font.family || undefined,
    wordmark_font_url:
      logo.wordmark_font.mode === "custom"
        ? logo.wordmark_font.url || undefined
        : undefined,
    wordmark_font_file_name: logo.wordmark_font.file_name,
    // legacy field for older consumers — only when actively used in the logo
    wordmark:
      active && logo.wordmark_mode === "font" && logo.wordmark_text
        ? { type: "text", value: logo.wordmark_text }
        : active && logo.wordmark_mode === "svg" && logo.wordmark_svg_url
          ? { type: "svg", value: logo.wordmark_svg_url }
          : undefined,
  }
}

export const StoreThemeEditor = () => {
  const { theme, isPending, isError, error } = useStoreTheme()
  const { mutateAsync: updateTheme, isPending: isSaving } =
    useUpdateStoreTheme()
  const { mutateAsync: publishTheme, isPending: isPublishing } =
    usePublishStoreTheme()
  const { mutateAsync: discardDraft, isPending: isDiscarding } =
    useDiscardStoreThemeDraft()
  const { mutateAsync: rollbackTheme, isPending: isRollingBack } =
    useRollbackStoreTheme()

  const [section, setSection] = useState<EditorSection>("radius")
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [iframeKey, setIframeKey] = useState(() => Date.now())
  const [dirty, setDirty] = useState(false)
  /** Path shown in preview address bar (homepage = /) */
  const [previewPath, setPreviewPath] = useState("/")
  const [pathDraft, setPathDraft] = useState("/")
  const [previewDevice, setPreviewDevice] =
    useState<PreviewDevice>("desktop")

  useEffect(() => {
    if (theme?.theme_config) {
      setDraft(draftFromConfig(theme.theme_config))
      setDirty(false)
    }
  }, [theme?.theme_config])

  const handleDiscard = async () => {
    if (!window.confirm("Discard your unpublished draft changes?")) return
    try {
      await discardDraft({})
      setDirty(false)
      setIframeKey(Date.now())
      toast.success("Draft changes discarded")
    } catch (err: any) {
      toast.error(err?.message || "Failed to discard draft")
    }
  }

  const handleRollback = async () => {
    if (!window.confirm("Roll back to previous published version?")) return
    try {
      await rollbackTheme({})
      setDirty(false)
      setIframeKey(Date.now())
      toast.success("Rolled back theme successfully")
    } catch (err: any) {
      toast.error(err?.message || "Failed to rollback theme")
    }
  }

  const handlePublish = async () => {
    try {
      if (dirty && draft) {
        // Save current draft first
        await updateTheme({
          overrides: {
            radius_step: draft.radius_step,
            fonts: {
              display: draft.fonts.display.family,
              text: draft.fonts.text.family,
              highlight: draft.fonts.highlight.family,
              display_url:
                draft.fonts.display.mode === "custom"
                  ? draft.fonts.display.url || undefined
                  : undefined,
              text_url:
                draft.fonts.text.mode === "custom"
                  ? draft.fonts.text.url || undefined
                  : undefined,
              highlight_url:
                draft.fonts.highlight.mode === "custom"
                  ? draft.fonts.highlight.url || undefined
                  : undefined,
            },
            colors: { ...draft.colors },
            colors_dark: { ...draft.colors_dark },
          },
          branding: draftLogoToBranding(draft.logo),
          homepage: {
            banners: draft.banners.filter((b) => b.url.trim()),
            promises: serializePromises(draft.promises),
            category_sections: serializeCategorySections(
              draft.category_sections
            ),
          },
        })
      }
      await publishTheme({})
      setDirty(false)
      setIframeKey(Date.now())
      toast.success("Theme published to live store successfully!")
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish theme")
    }
  }

  // Lock document scroll so the editor never reveals a black void underneath
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  const previewTenantId = theme?.tenant_id || null
  const previewSrc = useMemo(
    () =>
      storefrontPreviewUrl({
        path: previewPath,
        cacheBust: iframeKey,
        tenantId: previewTenantId,
      }),
    [iframeKey, previewTenantId, previewPath]
  )

  const refreshPreview = useCallback(() => {
    // New cache-bust + remount key so iframe always reloads
    setIframeKey(Date.now())
  }, [])

  const applyPreviewPath = useCallback(() => {
    const next = normalizePreviewPath(pathDraft)
    setPathDraft(next)
    setPreviewPath(next)
    setIframeKey(Date.now())
  }, [pathDraft])

  const patchDraft = useCallback((partial: Partial<DraftState>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev))
    setDirty(true)
  }, [])

  const handleSave = async () => {
    if (!draft) return
    try {
      await updateTheme({
        overrides: {
          radius_step: draft.radius_step,
          fonts: {
            display: draft.fonts.display.family,
            text: draft.fonts.text.family,
            highlight: draft.fonts.highlight.family,
            display_url:
              draft.fonts.display.mode === "custom"
                ? draft.fonts.display.url || undefined
                : undefined,
            text_url:
              draft.fonts.text.mode === "custom"
                ? draft.fonts.text.url || undefined
                : undefined,
            highlight_url:
              draft.fonts.highlight.mode === "custom"
                ? draft.fonts.highlight.url || undefined
                : undefined,
          },
          colors: { ...draft.colors },
          colors_dark: { ...draft.colors_dark },
        },
        branding: draftLogoToBranding(draft.logo),
        homepage: {
          banners: draft.banners.filter((b) => b.url.trim()),
          promises: serializePromises(draft.promises),
          category_sections: serializeCategorySections(
            draft.category_sections
          ),
        },
      })
      toast.success("Theme saved — preview updated")
      setDirty(false)
      refreshPreview()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save theme")
    }
  }

  if (isPending || !draft) {
    return (
      <div className="bg-ui-bg-base text-ui-fg-subtle flex h-screen items-center justify-center">
        Loading theme editor…
      </div>
    )
  }

  if (isError) {
    throw error
  }

  const themeName =
    theme?.theme_config?.tokens?.name ||
    theme?.theme_config?.active_theme_id ||
    "Theme"

  return (
    <div className="bg-ui-bg-base text-ui-fg-base fixed inset-0 z-[100] flex h-dvh max-h-dvh w-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="border-ui-border-base flex h-12 shrink-0 items-center justify-between gap-3 border-b px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="transparent" size="small" asChild>
            <Link to="/store">
              <ArrowUturnLeft />
            </Link>
          </Button>
          <Text size="small" weight="plus" className="truncate">
            Config Editor
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted truncate">
            {themeName}
          </Text>
          {dirty && (
            <span className="bg-ui-tag-orange-bg text-ui-tag-orange-text rounded px-1.5 py-0.5 text-[10px] font-medium uppercase">
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {theme?.theme_config?.draft && (
            <Button
              size="small"
              variant="transparent"
              isLoading={isDiscarding}
              disabled={isDiscarding}
              onClick={handleDiscard}
              title="Discard unpublished draft"
            >
              Discard
            </Button>
          )}
          {theme?.theme_config?.history && theme.theme_config.history.length > 0 && (
            <Button
              size="small"
              variant="transparent"
              isLoading={isRollingBack}
              disabled={isRollingBack}
              onClick={handleRollback}
              title="Rollback to previous version"
            >
              Rollback
            </Button>
          )}
          <Button
            size="small"
            variant="secondary"
            type="button"
            onClick={refreshPreview}
          >
            <ArrowPath className="mr-1" />
            Refresh preview
          </Button>
          <Button
            size="small"
            variant="secondary"
            isLoading={isSaving}
            disabled={isSaving}
            onClick={handleSave}
          >
            Save draft
          </Button>
          <Button
            size="small"
            isLoading={isPublishing}
            disabled={isPublishing}
            onClick={handlePublish}
          >
            <ArrowUpTray className="mr-1" />
            Publish
          </Button>
        </div>
      </header>

      {/* 3-column shell — no generic admin sidebar; no page-level scroll */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Editor section sidebar */}
        <nav className="border-ui-border-base bg-ui-bg-subtle theme-editor-scroll flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto overflow-x-hidden border-r py-3 sm:w-16">
          {SECTIONS.map((s) => {
            const active = section === s.id
            return (
              <button
                key={s.id}
                type="button"
                title={s.label}
                onClick={() => setSection(s.id)}
                className={clx(
                  "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md text-[9px] font-medium transition-colors",
                  active
                    ? "bg-ui-bg-base text-ui-fg-base shadow-sm"
                    : "text-ui-fg-muted hover:bg-ui-bg-base-hover hover:text-ui-fg-base"
                )}
              >
                <SectionIcon id={s.id} />
                <span className="mt-0.5 hidden sm:block">{s.label.slice(0, 4)}</span>
              </button>
            )
          })}
        </nav>

        {/* Inspector */}
        <aside className="border-ui-border-base flex w-[300px] shrink-0 flex-col overflow-hidden border-r sm:w-[340px]">
          <div className="border-ui-border-base shrink-0 border-b px-4 py-3">
            <Heading level="h2" className="text-base">
              {SECTIONS.find((s) => s.id === section)?.label}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              {SECTIONS.find((s) => s.id === section)?.hint}
            </Text>
          </div>
          <div className="theme-editor-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
            {section === "radius" && (
              <RadiusInspector
                value={draft.radius_step}
                onChange={(radius_step) => patchDraft({ radius_step })}
              />
            )}
            {section === "fonts" && (
              <FontsInspector
                value={draft.fonts}
                onChange={(fonts) => patchDraft({ fonts })}
              />
            )}
            {section === "colours" && (
              <ColoursInspector
                selectedPaletteId={draft.selectedPaletteId}
                selectedPaletteIdDark={draft.selectedPaletteIdDark}
                colors={draft.colors}
                colorsDark={draft.colors_dark}
                onPickPalette={(mode, id, colors) =>
                  mode === "light"
                    ? patchDraft({
                        selectedPaletteId: id,
                        colors: { ...draft.colors, ...colors },
                      })
                    : patchDraft({
                        selectedPaletteIdDark: id,
                        colors_dark: { ...draft.colors_dark, ...colors },
                      })
                }
                onColorChange={(mode, key, value) =>
                  mode === "light"
                    ? patchDraft({
                        selectedPaletteId: "custom",
                        colors: { ...draft.colors, [key]: value },
                      })
                    : patchDraft({
                        selectedPaletteIdDark: "custom",
                        colors_dark: { ...draft.colors_dark, [key]: value },
                      })
                }
              />
            )}
            {section === "logo" && (
              <LogoInspector
                value={draft.logo}
                onChange={(logo) => patchDraft({ logo })}
              />
            )}
            {section === "banners" && (
              <BannersInspector
                banners={draft.banners}
                onChange={(banners) => patchDraft({ banners })}
              />
            )}
            {section === "promises" && (
              <PromisesInspector
                value={draft.promises}
                onChange={(promises) => patchDraft({ promises })}
              />
            )}
            {section === "categories" && (
              <CategoriesInspector
                sections={draft.category_sections}
                onChange={(category_sections) =>
                  patchDraft({ category_sections })
                }
              />
            )}
          </div>
        </aside>

        {/* Iframe viewer — path bar, device frame, refresh */}
        <main className="bg-ui-bg-subtle relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Address + device toolbar */}
          <div className="border-ui-border-base flex shrink-0 flex-col gap-1.5 border-b px-2 py-1.5 sm:px-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BuildingStorefront className="text-ui-fg-muted hidden h-4 w-4 shrink-0 sm:block" />
              {/* Path address bar — homepage is / */}
              <div className="border-ui-border-base bg-ui-bg-field flex min-w-0 flex-1 items-center gap-1 rounded-md border px-2 py-1">
                <span className="text-ui-fg-muted hidden shrink-0 font-mono text-[11px] sm:inline">
                  {(
                    (import.meta as any).env?.VITE_MEDUSA_STOREFRONT_URL ||
                    (import.meta as any).env?.VITE_STOREFRONT_URL ||
                    "http://localhost:3001"
                  )
                    .toString()
                    .replace(/\/$/, "")}
                </span>
                <input
                  type="text"
                  value={pathDraft}
                  onChange={(e) => setPathDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      applyPreviewPath()
                    }
                  }}
                  placeholder="/"
                  spellCheck={false}
                  className="text-ui-fg-base min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-ui-fg-muted"
                  aria-label="Preview path"
                />
                <button
                  type="button"
                  onClick={applyPreviewPath}
                  className="text-ui-fg-subtle hover:text-ui-fg-base shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium hover:bg-ui-bg-base-hover"
                >
                  Go
                </button>
              </div>

              {/* Device toggle: desktop / tablet / phone */}
              <div className="border-ui-border-base flex shrink-0 items-center gap-0.5 rounded-md border p-0.5">
                {(
                  [
                    { id: "desktop" as const, Icon: ComputerDesktop, title: "Desktop" },
                    { id: "tablet" as const, Icon: Tablet, title: "Tablet" },
                    { id: "phone" as const, Icon: Phone, title: "Phone" },
                  ] as const
                ).map(({ id, Icon, title }) => (
                  <button
                    key={id}
                    type="button"
                    title={title}
                    aria-label={title}
                    aria-pressed={previewDevice === id}
                    onClick={() => setPreviewDevice(id)}
                    className={clx(
                      "flex h-7 w-7 items-center justify-center rounded",
                      previewDevice === id
                        ? "bg-ui-bg-base text-ui-fg-base shadow-sm"
                        : "text-ui-fg-muted hover:text-ui-fg-base"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                title="Refresh preview"
                aria-label="Refresh preview"
                onClick={refreshPreview}
                className="text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-base-hover flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              >
                <ArrowPath className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-start justify-center overflow-auto bg-neutral-200/40 p-2 sm:p-4 dark:bg-neutral-900/30">
            {previewTenantId ? (
              <div
                className={clx(
                  "border-ui-border-base bg-ui-bg-base relative flex h-full max-h-full flex-col overflow-hidden rounded-md border shadow-md transition-[width] duration-200",
                  previewDevice === "desktop" && "w-full",
                  previewDevice !== "desktop" && "mx-auto"
                )}
                style={{
                  width:
                    previewDevice === "desktop"
                      ? "100%"
                      : PREVIEW_DEVICE[previewDevice].width,
                  maxWidth: "100%",
                  height: "100%",
                }}
              >
                {/* Phone/tablet chrome notch strip */}
                {previewDevice !== "desktop" ? (
                  <div className="bg-ui-bg-subtle text-ui-fg-muted flex h-6 shrink-0 items-center justify-center border-b border-ui-border-base text-[10px]">
                    {PREVIEW_DEVICE[previewDevice].label}
                    {typeof PREVIEW_DEVICE[previewDevice].width === "number"
                      ? ` · ${PREVIEW_DEVICE[previewDevice].width}px`
                      : ""}
                  </div>
                ) : null}
                <iframe
                  key={`${iframeKey}-${previewTenantId}-${previewPath}`}
                  title="Storefront preview"
                  src={previewSrc}
                  className="bg-ui-bg-base h-full min-h-0 w-full flex-1 border-0"
                />
              </div>
            ) : (
              <div className="text-ui-fg-muted flex h-full items-center justify-center text-sm">
                Waiting for tenant theme…
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function SectionIcon({ id }: { id: EditorSection }) {
  const cls = "h-4 w-4"
  switch (id) {
    case "radius":
      return <CheckCircleSolid className={cls} />
    case "fonts":
      return <Text size="xsmall" weight="plus" className="leading-none">Aa</Text>
    case "colours":
      return <Swatch className={cls} />
    case "logo":
      return <PhotoSolid className={cls} />
    case "banners":
      return <PhotoSolid className={cls} />
    case "promises":
      return <ShieldCheck className={cls} />
    case "categories":
      return <TagSolid className={cls} />
    default:
      return null
  }
}

function RadiusInspector({
  value,
  onChange,
}: {
  value: 0 | 1 | 2 | 3 | 4
  onChange: (v: 0 | 1 | 2 | 3 | 4) => void
}) {
  return (
    <div className="space-y-4">
      <Text size="small" className="text-ui-fg-subtle">
        Five corner styles, from sharp to bubbly. Applied across buttons, cards,
        and inputs.
      </Text>
      <div className="flex flex-col gap-2">
        {([0, 1, 2, 3, 4] as const).map((step) => {
          const r = [0, 4, 8, 12, 16][step]
          const active = value === step
          return (
            <button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              className={clx(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-ui-fg-interactive bg-ui-bg-field"
                  : "border-ui-border-base hover:bg-ui-bg-subtle"
              )}
            >
              <div
                className="border-ui-border-strong bg-ui-bg-base h-10 w-10 border-2"
                style={{ borderRadius: r }}
              />
              <div>
                <Text size="small" weight="plus">
                  {RADIUS_LABELS[step]}
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  radius_step {step} · {r}px
                </Text>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FontsInspector({
  value,
  onChange,
}: {
  value: DraftFonts
  onChange: (v: DraftFonts) => void
}) {
  const roles: Array<{ key: keyof DraftFonts; label: string }> = [
    { key: "display", label: "Display" },
    { key: "text", label: "Text" },
    { key: "highlight", label: "Highlight" },
  ]
  return (
    <div className="space-y-5">
      {roles.map((role) => (
        <GoogleFontPicker
          key={role.key}
          label={role.label}
          value={value[role.key]}
          onChange={(next) => onChange({ ...value, [role.key]: next })}
        />
      ))}
    </div>
  )
}

function ColoursInspector({
  selectedPaletteId,
  selectedPaletteIdDark,
  colors,
  colorsDark,
  onPickPalette,
  onColorChange,
}: {
  selectedPaletteId: string
  selectedPaletteIdDark: string
  colors: Record<string, string>
  colorsDark: Record<string, string>
  onPickPalette: (
    mode: "light" | "dark",
    id: string,
    c: Partial<Record<(typeof COLOR_KEYS)[number], string>>
  ) => void
  onColorChange: (mode: "light" | "dark", key: string, value: string) => void
}) {
  const [mode, setMode] = useState<"light" | "dark">("light")
  const [paletteOpen, setPaletteOpen] = useState(false)

  const activePaletteId =
    mode === "light" ? selectedPaletteId : selectedPaletteIdDark
  const activeColors = mode === "light" ? colors : colorsDark
  const selectedPreset = PRIMARY_PALETTES.find((p) => p.id === activePaletteId)
  const selectedLabel =
    activePaletteId === "custom"
      ? "Custom"
      : selectedPreset?.label || "Select palette"
  const presetSwatches =
    mode === "light" ? selectedPreset?.light : selectedPreset?.dark
  const swatchColors =
    activePaletteId === "custom"
      ? [activeColors.background, activeColors.foreground, activeColors.accent]
      : [
          presetSwatches?.background,
          presetSwatches?.foreground,
          presetSwatches?.accent,
        ]

  const pick = (id: string) => {
    if (id === "custom") {
      onPickPalette(mode, "custom", activeColors)
    } else {
      const p = PRIMARY_PALETTES.find((x) => x.id === id)
      if (p) onPickPalette(mode, p.id, mode === "light" ? p.light : p.dark)
    }
    setPaletteOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="border-ui-border-base flex gap-0.5 rounded-md border p-0.5">
          {(
            [
              { id: "light" as const, label: "Light" },
              { id: "dark" as const, label: "Dark" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id)
                setPaletteOpen(false)
              }}
              className={clx(
                "flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors",
                mode === m.id
                  ? "bg-ui-bg-base text-ui-fg-base shadow-sm"
                  : "text-ui-fg-muted hover:text-ui-fg-base"
              )}
            >
              {m.label} palette
            </button>
          ))}
        </div>
        <Text size="xsmall" className="text-ui-fg-muted">
          Shoppers can switch light/dark on the storefront. Configure both
          palettes here.
        </Text>
      </div>

      <div className="space-y-2">
        <Label>
          {mode === "light" ? "Light" : "Dark"} palette
        </Label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPaletteOpen((o) => !o)}
            className={clx(
              "bg-ui-bg-field shadow-buttons-neutral hover:bg-ui-bg-field-hover flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left",
              paletteOpen && "shadow-borders-interactive-with-active"
            )}
            aria-expanded={paletteOpen}
            aria-haspopup="listbox"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex shrink-0 -space-x-1">
                {swatchColors.map((c, i) => (
                  <span
                    key={i}
                    className="border-ui-border-base inline-block h-4 w-4 rounded-full border"
                    style={{ background: c || "#888" }}
                  />
                ))}
              </span>
              <span className="txt-compact-small text-ui-fg-base truncate">
                {selectedLabel}
              </span>
            </span>
            <span className="text-ui-fg-muted text-xs">
              {paletteOpen ? "▲" : "▼"}
            </span>
          </button>

          {paletteOpen ? (
            <ul
              role="listbox"
              className="border-ui-border-base bg-ui-bg-base absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-md border py-1 shadow-elevation-flyout"
            >
              {PRIMARY_PALETTES.map((p) => {
                const preset = mode === "light" ? p.light : p.dark
                const active = activePaletteId === p.id
                return (
                  <li key={p.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={clx(
                        "hover:bg-ui-bg-base-hover flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm",
                        active && "bg-ui-bg-field"
                      )}
                      onClick={() => pick(p.id)}
                    >
                      <span className="flex -space-x-1">
                        {["background", "foreground", "accent"].map((k) => (
                          <span
                            key={k}
                            className="border-ui-border-base inline-block h-3.5 w-3.5 rounded-full border"
                            style={{
                              background:
                                preset[k as keyof typeof preset] || "#888",
                            }}
                          />
                        ))}
                      </span>
                      {p.label}
                    </button>
                  </li>
                )
              })}
              <li role="option" aria-selected={activePaletteId === "custom"}>
                <button
                  type="button"
                  className={clx(
                    "hover:bg-ui-bg-base-hover flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm",
                    activePaletteId === "custom" && "bg-ui-bg-field"
                  )}
                  onClick={() => pick("custom")}
                >
                  <span className="flex -space-x-1">
                    {[
                      activeColors.background,
                      activeColors.foreground,
                      activeColors.accent,
                    ].map((c, i) => (
                      <span
                        key={i}
                        className="border-ui-border-base inline-block h-3.5 w-3.5 rounded-full border"
                        style={{ background: c || "#888" }}
                      />
                    ))}
                  </span>
                  Custom
                </button>
              </li>
            </ul>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Text size="small" weight="plus">
          {mode === "light" ? "Light" : "Dark"} colors
        </Text>
        <div className="space-y-2">
          {COLOR_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <ColorPickerField
                value={normalizeHex(activeColors[key])}
                onChange={(hex) => onColorChange(mode, key, hex)}
              />
              <div className="min-w-0 flex-1">
                <Text size="xsmall" className="text-ui-fg-muted">
                  {key}
                </Text>
                <Input
                  value={activeColors[key] || ""}
                  onChange={(e) => onColorChange(mode, key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** shadcn Popover + native color input (shadcn-style color field) */
function ColorPickerField({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  const hex = normalizeHex(value)
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="border-ui-border-base h-9 w-9 shrink-0 rounded-md border shadow-sm"
        style={{ backgroundColor: hex }}
        aria-label="Pick color"
      />
      <PopoverContent
        align="start"
        className="z-[200] w-auto p-3"
        // Above full-screen config editor (z-100)
      >
        <div className="flex flex-col gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="h-32 w-40 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <Input
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function LogoInspector({
  value,
  onChange,
}: {
  value: DraftLogo
  onChange: (v: DraftLogo) => void
}) {
  const patch = (partial: Partial<DraftLogo>) =>
    onChange({ ...value, ...partial })

  return (
    <div className="space-y-6">
      {/* 1. Icon SVG */}
      <div className="space-y-2">
        <Label>Icon</Label>
        <ServerFileUpload
          accept=".svg,image/svg+xml"
          label="Upload icon SVG"
          fileName={value.icon_file_name}
          url={value.icon_url}
          onUploaded={(url, file_name) =>
            patch({ icon_url: url, icon_file_name: file_name })
          }
          onClear={() =>
            patch({ icon_url: "", icon_file_name: undefined })
          }
        />
        {value.icon_url ? (
          <div className="border-ui-border-base bg-ui-bg-subtle flex h-14 items-center justify-center rounded-md border">
            <img
              src={value.icon_url}
              alt="Icon"
              className="max-h-10 max-w-[70%]"
            />
          </div>
        ) : null}
      </div>

      {/* 2. Wordmark switch */}
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="wordmark-switch">Wordmark</Label>
        <Switch
          id="wordmark-switch"
          checked={value.wordmark_enabled}
          onCheckedChange={(checked) => patch({ wordmark_enabled: checked })}
        />
      </div>

      {/* 3. Wordmark options — always mounted; dimmed when switch is off */}
      <div
        className={clx(
          "space-y-3 rounded-md transition-opacity",
          !value.wordmark_enabled && "pointer-events-none select-none opacity-40"
        )}
        aria-disabled={!value.wordmark_enabled}
      >
        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: "svg" as const, label: "SVG" },
              { id: "font" as const, label: "Font" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={!value.wordmark_enabled}
              onClick={() => patch({ wordmark_mode: m.id })}
              className={clx(
                "rounded-md border px-2.5 py-1 text-xs font-medium",
                value.wordmark_mode === m.id
                  ? "border-ui-fg-base bg-ui-bg-base text-ui-fg-base"
                  : "border-ui-border-base text-ui-fg-muted hover:text-ui-fg-base",
                !value.wordmark_enabled && "cursor-not-allowed"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {value.wordmark_mode === "svg" && (
          <div className="space-y-2">
            <ServerFileUpload
              accept=".svg,image/svg+xml"
              label="Upload wordmark SVG"
              fileName={value.wordmark_svg_file_name}
              url={value.wordmark_svg_url}
              disabled={!value.wordmark_enabled}
              onUploaded={(url, file_name) =>
                patch({
                  wordmark_svg_url: url,
                  wordmark_svg_file_name: file_name,
                })
              }
              onClear={() =>
                patch({
                  wordmark_svg_url: "",
                  wordmark_svg_file_name: undefined,
                })
              }
            />
            {value.wordmark_svg_url ? (
              <div className="border-ui-border-base bg-ui-bg-subtle flex h-12 items-center justify-center rounded-md border px-3">
                <img
                  src={value.wordmark_svg_url}
                  alt="Wordmark"
                  className="max-h-8 max-w-full"
                />
              </div>
            ) : null}
          </div>
        )}

        {value.wordmark_mode === "font" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Text</Label>
              <Input
                placeholder="Store name"
                value={value.wordmark_text}
                disabled={!value.wordmark_enabled}
                onChange={(e) => patch({ wordmark_text: e.target.value })}
              />
            </div>
            <GoogleFontPicker
              label="Font"
              value={value.wordmark_font}
              disabled={!value.wordmark_enabled}
              onChange={(wordmark_font) => patch({ wordmark_font })}
            />
          </div>
        )}
      </div>

      {/* Live composition preview */}
      <div
        className={clx(
          "border-ui-border-base bg-ui-bg-subtle flex items-center justify-center gap-2 rounded-md border px-4 py-4 transition-opacity",
          !value.icon_url && !value.wordmark_enabled && "opacity-40"
        )}
      >
        {value.icon_url ? (
          <img
            src={value.icon_url}
            alt=""
            className="h-8 w-8 object-contain"
          />
        ) : (
          <div className="border-ui-border-base text-ui-fg-disabled flex h-8 w-8 items-center justify-center rounded border border-dashed text-[10px]">
            icon
          </div>
        )}
        {value.wordmark_enabled &&
          value.wordmark_mode === "svg" &&
          value.wordmark_svg_url && (
            <img
              src={value.wordmark_svg_url}
              alt=""
              className="h-6 max-w-[140px] object-contain"
            />
          )}
        {value.wordmark_enabled &&
          value.wordmark_mode === "font" &&
          value.wordmark_text && (
            <span
              className="text-base font-semibold"
              style={{
                fontFamily: value.wordmark_font.family
                  ? `"${value.wordmark_font.family}", system-ui`
                  : undefined,
              }}
            >
              {value.wordmark_text}
            </span>
          )}
        {value.wordmark_enabled &&
          value.wordmark_mode === "font" &&
          !value.wordmark_text && (
            <span className="text-ui-fg-disabled text-sm">wordmark</span>
          )}
      </div>
    </div>
  )
}

function ServerFileUpload({
  accept,
  label,
  fileName,
  url,
  disabled,
  onUploaded,
  onClear,
}: {
  accept: string
  label: string
  fileName?: string
  url?: string
  disabled?: boolean
  onUploaded: (url: string, fileName: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | null) => {
    if (!file || disabled) return
    setUploading(true)
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] })
      const uploaded = files?.[0]
      if (!uploaded?.url) {
        throw new Error("Upload succeeded but no file URL was returned")
      }
      onUploaded(uploaded.url, file.name)
      toast.success(`Uploaded ${file.name}`)
    } catch (err: any) {
      toast.error(err?.message || "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  if (url) {
    return (
      <div
        className={clx(
          "border-ui-border-base bg-ui-bg-subtle flex items-center gap-2 rounded-md border px-3 py-2",
          disabled && "opacity-60"
        )}
      >
        <Text size="small" className="min-w-0 flex-1 truncate">
          {fileName || "File uploaded"}
        </Text>
        <Button
          size="small"
          variant="transparent"
          type="button"
          disabled={disabled}
          onClick={onClear}
        >
          <XMarkMini />
        </Button>
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      <Button
        size="small"
        variant="secondary"
        type="button"
        isLoading={uploading}
        disabled={uploading || disabled}
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        <ArrowUpTray className="mr-1.5" />
        {label}
      </Button>
    </div>
  )
}

/**
 * Storefront hero banner size guide.
 * Full height is always shown; narrower viewports crop left/right only.
 * Aspect ~ 8:3 (wide hero, not YouTube channel art).
 */
const BANNER_GUIDE = {
  full: { w: 1920, h: 720, label: "Full upload" },
  desktop: { w: 1920, h: 720, label: "Desktop" },
  tablet: { w: 1280, h: 720, label: "Tablet" },
  mobile: { w: 780, h: 720, label: "Mobile" },
} as const

function BannerSizeGuidePopover() {
  // viewBox matches hero aspect (1920×720 → 16:6 = 8:3)
  const VW = 320
  const VH = 120
  const scaleX = VW / BANNER_GUIDE.full.w
  const tabletW = BANNER_GUIDE.tablet.w * scaleX
  const mobileW = BANNER_GUIDE.mobile.w * scaleX
  const tabletX = (VW - tabletW) / 2
  const mobileX = (VW - mobileW) / 2
  // Full height always — no top/bottom crop
  const y = 0
  const h = VH

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="text-ui-fg-muted hover:text-ui-fg-subtle hover:bg-ui-bg-base-hover inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        aria-label="Banner size guide"
      >
        <InformationCircle />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="z-[200] w-[min(22rem,calc(100vw-2rem))] p-3"
      >
        <div className="space-y-3">
          <div>
            <Text size="small" weight="plus">
              Hero banner size guide
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle mt-0.5 block">
              Upload {BANNER_GUIDE.full.w}×{BANNER_GUIDE.full.h}px (8:3). The
              hero shows the full height — only the sides crop on tablet and
              mobile. Keep text and logos in the center.
            </Text>
          </div>

          {/* Full-height nested columns (side crop only) */}
          <div className="border-ui-border-base overflow-hidden rounded-md border bg-[#f4f4f5]">
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              className="h-auto w-full"
              role="img"
              aria-label="Hero banner safe zones — full height, side crops"
            >
              {/* Desktop / full canvas — full height + width */}
              <rect
                x="0.5"
                y="0.5"
                width={VW - 1}
                height={VH - 1}
                fill="#e4e4e7"
                stroke="#71717a"
                strokeWidth="1"
              />
              {/* Dim left/right edges outside tablet (what desktop-only edges may lose on mid screens) */}
              <rect
                x="0"
                y={y}
                width={tabletX}
                height={h}
                fill="#a1a1aa"
                opacity="0.25"
              />
              <rect
                x={tabletX + tabletW}
                y={y}
                width={VW - tabletX - tabletW}
                height={h}
                fill="#a1a1aa"
                opacity="0.25"
              />
              {/* Tablet — full height */}
              <rect
                x={tabletX}
                y={y}
                width={tabletW}
                height={h}
                fill="#bfdbfe"
                stroke="#3b82f6"
                strokeWidth="0.9"
                opacity="0.95"
              />
              {/* Mobile — full height, center */}
              <rect
                x={mobileX}
                y={y}
                width={mobileW}
                height={h}
                fill="#bbf7d0"
                stroke="#16a34a"
                strokeWidth="1.2"
              />
              <text
                x={VW / 2}
                y={VH / 2 + 2}
                textAnchor="middle"
                fill="#14532d"
                fontSize="8"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                Safe on all devices
              </text>
              <text
                x="6"
                y="12"
                fill="#52525b"
                fontSize="7"
                fontFamily="system-ui, sans-serif"
              >
                {BANNER_GUIDE.full.w} × {BANNER_GUIDE.full.h} · full height
              </text>
              {/* Side labels */}
              <text
                x="6"
                y={VH - 6}
                fill="#71717a"
                fontSize="6"
                fontFamily="system-ui, sans-serif"
              >
                ← sides crop
              </text>
              <text
                x={VW - 6}
                y={VH - 6}
                textAnchor="end"
                fill="#71717a"
                fontSize="6"
                fontFamily="system-ui, sans-serif"
              >
                sides crop →
              </text>
            </svg>
          </div>

          <ul className="space-y-1.5">
            {(
              [
                {
                  key: "full",
                  color: "#e4e4e7",
                  border: "#71717a",
                  title: "Full upload / desktop",
                  detail: `${BANNER_GUIDE.full.w} × ${BANNER_GUIDE.full.h} px`,
                  hint: "Hero canvas · 8:3 · full height",
                },
                {
                  key: "tablet",
                  color: "#bfdbfe",
                  border: "#3b82f6",
                  title: "Tablet safe width",
                  detail: `${BANNER_GUIDE.tablet.w} × ${BANNER_GUIDE.tablet.h} px`,
                  hint: "Full height · sides may crop",
                },
                {
                  key: "mobile",
                  color: "#bbf7d0",
                  border: "#16a34a",
                  title: "Mobile safe width",
                  detail: `${BANNER_GUIDE.mobile.w} × ${BANNER_GUIDE.mobile.h} px`,
                  hint: "Full height · keep text here",
                },
              ] as const
            ).map((row) => (
              <li key={row.key} className="flex items-start gap-2">
                <span
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm border"
                  style={{
                    backgroundColor: row.color,
                    borderColor: row.border,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <Text size="xsmall" weight="plus">
                      {row.title}
                    </Text>
                    <Text
                      size="xsmall"
                      className="text-ui-fg-subtle tabular-nums"
                    >
                      {row.detail}
                    </Text>
                  </div>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {row.hint}
                  </Text>
                </div>
              </li>
            ))}
          </ul>

          <Text size="xsmall" className="text-ui-fg-muted">
            PNG, JPG, or WebP. Height is never cropped — only left/right edges
            on smaller screens. Put headlines and CTAs in the green center.
          </Text>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function BannersInspector({
  banners,
  onChange,
}: {
  banners: { url: string; alt?: string }[]
  onChange: (b: { url: string; alt?: string }[]) => void
}) {
  const update = (
    index: number,
    patch: Partial<{ url: string; alt?: string }>
  ) => {
    const next = banners.map((b, i) => (i === index ? { ...b, ...patch } : b))
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <Text size="small" className="text-ui-fg-subtle">
          Homepage banners. Upload {BANNER_GUIDE.full.w}×{BANNER_GUIDE.full.h}
          px images. More than one becomes a carousel.
        </Text>
        <div className="flex shrink-0 items-center gap-0.5">
          <Text size="xsmall" className="text-ui-fg-muted">
            Size
          </Text>
          <BannerSizeGuidePopover />
        </div>
      </div>

      {banners.map((b, i) => (
        <div
          key={i}
          className="border-ui-border-base space-y-3 rounded-lg border p-3"
        >
          <div className="flex items-center justify-between">
            <Text size="small" weight="plus">
              Banner {i + 1}
            </Text>
            <Button
              size="small"
              variant="transparent"
              type="button"
              onClick={() => onChange(banners.filter((_, j) => j !== i))}
            >
              Remove
            </Button>
          </div>

          <ServerFileUpload
            accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
            label="Upload banner image"
            url={b.url}
            fileName={b.url ? b.url.split("/").pop() : undefined}
            onUploaded={(url) => update(i, { url })}
            onClear={() => update(i, { url: "" })}
          />

          {b.url ? (
            <div
              className="border-ui-border-base bg-ui-bg-subtle relative overflow-hidden rounded-md border"
              style={{
                aspectRatio: `${BANNER_GUIDE.full.w} / ${BANNER_GUIDE.full.h}`,
              }}
            >
              <img
                src={b.url}
                alt={b.alt || `Banner ${i + 1}`}
                className="h-full w-full object-cover object-center"
              />
              {/* Full-height mobile safe zone (side crop only) */}
              <div className="pointer-events-none absolute inset-0 flex justify-center">
                <div
                  className="h-full border-x border-dashed border-emerald-500/70 bg-emerald-500/10"
                  style={{
                    width: `${(BANNER_GUIDE.mobile.w / BANNER_GUIDE.full.w) * 100}%`,
                  }}
                  title="Mobile safe zone — full height"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Alt text</Label>
            <Input
              placeholder="Describe the banner for accessibility"
              value={b.alt || ""}
              onChange={(e) => update(i, { alt: e.target.value })}
            />
          </div>
        </div>
      ))}

      <Button
        size="small"
        variant="secondary"
        type="button"
        onClick={() => onChange([...banners, { url: "", alt: "" }])}
      >
        Add banner
      </Button>
      {banners.filter((b) => b.url).length > 1 && (
        <Text size="xsmall" className="text-ui-fg-muted">
          {banners.filter((b) => b.url).length} banners → carousel on homepage
        </Text>
      )}
    </div>
  )
}

function normalizeHex(value?: string): string {
  if (!value) return "#888888"
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const r = value[1]
    const g = value[2]
    const b = value[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return "#888888"
}

// re-export for lazy route
export default StoreThemeEditor
