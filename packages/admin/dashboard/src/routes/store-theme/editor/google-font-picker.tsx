import { useEffect, useMemo, useRef, useState } from "react"
import { Button, Input, Label, Text, clx, toast } from "@bentoco/ui"
import { ArrowUpTray, XMarkMini } from "@bentoco/icons"
import { sdk } from "../../../lib/client"
import {
  filterFontFamilies,
  ensureGoogleFontPreviewStylesheet,
  isGoogleWebFont,
  loadGoogleFontsCatalog,
  SYSTEM_FONT_OPTIONS,
  GOOGLE_FONTS_FALLBACK,
} from "./google-fonts"

export type FontRoleValue = {
  family: string
  /** Server-hosted file URL after upload (internal; not user-facing URL paste) */
  url?: string
  /** Original uploaded file name for UI */
  file_name?: string
  mode: "google" | "custom"
}

type GoogleFontPickerProps = {
  label: string
  value: FontRoleValue
  onChange: (next: FontRoleValue) => void
  disabled?: boolean
}

const FONT_ACCEPT = ".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"

/**
 * Per-role font control: Google catalog OR custom font uploaded to our server.
 */
export function GoogleFontPicker({
  label,
  value,
  onChange,
  disabled = false,
}: GoogleFontPickerProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [families, setFamilies] = useState<string[]>([
    ...SYSTEM_FONT_OPTIONS,
    ...GOOGLE_FONTS_FALLBACK,
  ])
  const rootRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    loadGoogleFontsCatalog().then((cat) => {
      if (cancelled) return
      const merged = Array.from(
        new Set([...SYSTEM_FONT_OPTIONS, ...cat.families])
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      setFamilies(merged)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (value.mode === "google" && value.family) {
      ensureGoogleFontPreviewStylesheet(value.family)
    }
  }, [value.mode, value.family])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const options = useMemo(
    () => filterFontFamilies(families, query, 100),
    [families, query]
  )

  const previewFamily =
    value.mode === "google" && isGoogleWebFont(value.family)
      ? `"${value.family}", system-ui, sans-serif`
      : value.family
        ? `"${value.family}", system-ui, sans-serif`
        : "system-ui"

  // Load uploaded font for in-editor preview via @font-face
  useEffect(() => {
    if (value.mode !== "custom" || !value.url || !value.family) return
    if (typeof document === "undefined") return
    const id = `preview-face-${value.family.replace(/\s+/g, "-")}`
    let el = document.getElementById(id) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement("style")
      el.id = id
      document.head.appendChild(el)
    }
    const format = value.url.match(/\.woff2/i)
      ? "woff2"
      : value.url.match(/\.woff/i)
        ? "woff"
        : value.url.match(/\.otf/i)
          ? "opentype"
          : "truetype"
    el.textContent = `@font-face{font-family:"${value.family.replace(
      /"/g,
      ""
    )}";src:url("${value.url}") format("${format}");font-display:swap;font-weight:100 900;}`
  }, [value.mode, value.url, value.family])

  const handleUpload = async (file: File | null) => {
    if (!file || disabled) return
    const okType =
      /\.(woff2|woff|ttf|otf)$/i.test(file.name) ||
      file.type.includes("font") ||
      file.type === "application/octet-stream"
    if (!okType) {
      toast.error("Upload a font file (.woff2, .woff, .ttf, or .otf)")
      return
    }

    setUploading(true)
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] })
      const uploaded = files?.[0]
      if (!uploaded?.url) {
        throw new Error("Upload succeeded but no file URL was returned")
      }

      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
      const family =
        value.family?.trim() ||
        baseName.replace(/\b\w/g, (c) => c.toUpperCase()) ||
        "Custom Font"

      onChange({
        mode: "custom",
        family,
        url: uploaded.url,
        file_name: file.name,
      })
      toast.success(`Uploaded ${file.name}`)
    } catch (err: any) {
      toast.error(err?.message || "Font upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const clearUpload = () => {
    onChange({
      mode: "custom",
      family: value.family,
      url: undefined,
      file_name: undefined,
    })
  }

  return (
    <div
      ref={rootRef}
      className={clx("relative space-y-2", disabled && "pointer-events-none")}
      aria-disabled={disabled}
    >
      <Label>{label}</Label>

      <div className="flex gap-1">
        <ModePill
          active={value.mode === "google"}
          disabled={disabled}
          onClick={() =>
            onChange({
              family: value.family || "DM Sans",
              mode: "google",
            })
          }
          label="Google"
        />
        <ModePill
          active={value.mode === "custom"}
          disabled={disabled}
          onClick={() =>
            onChange({
              family: value.family || "",
              url: value.url,
              file_name: value.file_name,
              mode: "custom",
            })
          }
          label="Custom"
        />
      </div>

      {value.mode === "google" ? (
        <>
          <Input
            value={open ? query : value.family}
            placeholder="Search Google Fonts…"
            disabled={disabled}
            onFocus={() => {
              if (disabled) return
              setOpen(true)
              setQuery("")
            }}
            onChange={(e) => {
              setOpen(true)
              setQuery(e.target.value)
            }}
            autoComplete="off"
          />
          {open && !disabled && (
            <div className="border-ui-border-base bg-ui-bg-base absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border shadow-elevation-flyout">
              {options.length === 0 ? (
                <div className="text-ui-fg-muted px-3 py-2 text-sm">
                  No fonts match “{query}”
                </div>
              ) : (
                options.map((family) => {
                  const active = family === value.family
                  return (
                    <button
                      key={family}
                      type="button"
                      className={clx(
                        "hover:bg-ui-bg-base-hover flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                        active && "bg-ui-bg-field"
                      )}
                      onMouseEnter={() =>
                        ensureGoogleFontPreviewStylesheet(family)
                      }
                      onClick={() => {
                        onChange({ family, mode: "google" })
                        setOpen(false)
                        setQuery("")
                        ensureGoogleFontPreviewStylesheet(family)
                      }}
                    >
                      <span style={{ fontFamily: `"${family}", system-ui` }}>
                        {family}
                      </span>
                      {!isGoogleWebFont(family) && (
                        <span className="text-ui-fg-muted text-[10px] uppercase">
                          system
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Font family name"
            value={value.family}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...value, mode: "custom", family: e.target.value })
            }
          />

          {value.url ? (
            <div className="border-ui-border-base bg-ui-bg-subtle flex items-center gap-2 rounded-md border px-3 py-2">
              <Text size="small" className="min-w-0 flex-1 truncate">
                {value.file_name || "Font uploaded"}
              </Text>
              <Button
                size="small"
                variant="transparent"
                type="button"
                disabled={disabled}
                onClick={clearUpload}
                title="Remove font file"
              >
                <XMarkMini />
              </Button>
            </div>
          ) : (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept={FONT_ACCEPT}
                className="sr-only"
                disabled={disabled}
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
              />
              <Button
                size="small"
                variant="secondary"
                type="button"
                isLoading={uploading}
                disabled={uploading || disabled}
                onClick={() => fileRef.current?.click()}
                className="w-full"
              >
                <ArrowUpTray className="mr-1.5" />
                Upload font
              </Button>
            </div>
          )}
        </div>
      )}

      <p
        className="text-ui-fg-subtle border-ui-border-base bg-ui-bg-subtle rounded-md border px-3 py-2 text-sm"
        style={{ fontFamily: previewFamily }}
      >
        Aa Bb Cc 123
      </p>
    </div>
  )
}

function ModePill({
  active,
  onClick,
  label,
  disabled,
}: {
  active: boolean
  onClick: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clx(
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-ui-fg-base bg-ui-bg-base text-ui-fg-base"
          : "border-ui-border-base text-ui-fg-muted hover:text-ui-fg-base",
        disabled && "cursor-not-allowed"
      )}
    >
      {label}
    </button>
  )
}
