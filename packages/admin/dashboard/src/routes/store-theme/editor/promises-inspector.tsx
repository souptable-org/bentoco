import { useRef, useState } from "react"
import {
  Button,
  Input,
  Label,
  Switch,
  Text,
  clx,
  toast,
} from "@bentoco/ui"
import {
  ArrowUpTray,
  BadgeCheck,
  Bolt,
  CheckCircleSolid,
  Clock,
  CurrencyDollar,
  Gift,
  Globe,
  HandTruck,
  Heart,
  ShieldCheck,
  Sparkles,
  StarSolid,
  TruckFast,
  XMarkMini,
} from "@bentoco/icons"
import { sdk } from "../../../lib/client"

/** Stable icon keys stored in theme_config (storefront maps the same keys). */
export const PROMISE_ICONS = [
  { id: "truck", label: "Delivery", Icon: TruckFast },
  { id: "hand-truck", label: "Shipping", Icon: HandTruck },
  { id: "shield", label: "Trust", Icon: ShieldCheck },
  { id: "check", label: "Quality", Icon: CheckCircleSolid },
  { id: "badge", label: "Verified", Icon: BadgeCheck },
  { id: "star", label: "Rating", Icon: StarSolid },
  { id: "sparkles", label: "Premium", Icon: Sparkles },
  { id: "heart", label: "Care", Icon: Heart },
  { id: "gift", label: "Gifts", Icon: Gift },
  { id: "globe", label: "Global", Icon: Globe },
  { id: "clock", label: "Fast", Icon: Clock },
  { id: "bolt", label: "Express", Icon: Bolt },
  { id: "rupee", label: "Price", Icon: CurrencyDollar },
] as const

export type PromiseIconId = (typeof PROMISE_ICONS)[number]["id"]

export type DraftPromiseItem = {
  key: string
  /** preset = library icon; custom = uploaded SVG/PNG */
  icon_mode: "preset" | "custom"
  icon: PromiseIconId
  icon_url?: string
  icon_file_name?: string
  text: string
}

export type DraftPromises = {
  enabled: boolean
  items: DraftPromiseItem[]
}

const MAX_PROMISES = 4
const MIN_PROMISES = 0

const ICON_ACCEPT =
  ".svg,image/svg+xml,image/png,image/webp,image/jpeg,.png,.jpg,.jpeg,.webp"

export function defaultPromises(): DraftPromises {
  return {
    enabled: true,
    items: [
      {
        key: "p1",
        icon_mode: "preset",
        icon: "truck",
        text: "Free delivery",
      },
      {
        key: "p2",
        icon_mode: "preset",
        icon: "shield",
        text: "100% authentic",
      },
      {
        key: "p3",
        icon_mode: "preset",
        icon: "check",
        text: "Easy returns",
      },
    ],
  }
}

function isPresetIcon(id?: string): id is PromiseIconId {
  return !!id && PROMISE_ICONS.some((x) => x.id === id)
}

export function normalizePromises(raw?: {
  enabled?: boolean
  items?: Array<{
    icon?: string
    icon_mode?: string
    icon_url?: string
    icon_file_name?: string
    text?: string
  }>
}): DraftPromises {
  if (!raw) return defaultPromises()
  const items = (raw.items || []).slice(0, MAX_PROMISES).map((it, i) => {
    const hasCustom = Boolean(it.icon_url)
    const icon_mode: "preset" | "custom" =
      it.icon_mode === "custom" || hasCustom
        ? "custom"
        : it.icon_mode === "preset"
          ? "preset"
          : hasCustom
            ? "custom"
            : "preset"

    return {
      key: `p_${i}_${it.icon || "truck"}`,
      icon_mode,
      icon: isPresetIcon(it.icon) ? it.icon : ("check" as PromiseIconId),
      icon_url: it.icon_url || undefined,
      icon_file_name: it.icon_file_name,
      text: it.text || "",
    }
  })
  return {
    enabled: raw.enabled !== false,
    items,
  }
}

export function serializePromises(p: DraftPromises): {
  enabled: boolean
  items: Array<{
    icon: string
    icon_mode: "preset" | "custom"
    icon_url?: string
    icon_file_name?: string
    text: string
  }>
} {
  return {
    enabled: p.enabled,
    items: p.items
      .filter((it) => it.text.trim())
      .slice(0, MAX_PROMISES)
      .map((it) => {
        if (it.icon_mode === "custom" && it.icon_url) {
          return {
            icon: "custom",
            icon_mode: "custom" as const,
            icon_url: it.icon_url,
            icon_file_name: it.icon_file_name,
            text: it.text.trim(),
          }
        }
        return {
          icon: it.icon,
          icon_mode: "preset" as const,
          text: it.text.trim(),
        }
      }),
  }
}

function newItem(): DraftPromiseItem {
  return {
    key: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    icon_mode: "preset",
    icon: "check",
    text: "",
  }
}

function ModePill({
  active,
  label,
  onClick,
  disabled,
}: {
  active: boolean
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clx(
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-ui-fg-base bg-ui-bg-base text-ui-fg-base"
          : "border-ui-border-base text-ui-fg-muted hover:text-ui-fg-base",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {label}
    </button>
  )
}

function CustomIconUpload({
  url,
  fileName,
  disabled,
  onUploaded,
  onClear,
}: {
  url?: string
  fileName?: string
  disabled?: boolean
  onUploaded: (url: string, fileName: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | null) => {
    if (!file || disabled) return
    const ok =
      /\.(svg|png|jpe?g|webp)$/i.test(file.name) ||
      file.type.startsWith("image/")
    if (!ok) {
      toast.error("Upload an SVG, PNG, JPG, or WebP icon")
      return
    }
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
        <img
          src={url}
          alt=""
          className="h-8 w-8 shrink-0 object-contain"
        />
        <Text size="small" className="min-w-0 flex-1 truncate">
          {fileName || "Custom icon"}
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
        accept={ICON_ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
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
        Upload custom icon
      </Button>
      <Text size="xsmall" className="text-ui-fg-muted mt-1 block">
        SVG preferred · PNG / WebP / JPG also fine · square works best
      </Text>
    </div>
  )
}

export function PromisesInspector({
  value,
  onChange,
}: {
  value: DraftPromises
  onChange: (next: DraftPromises) => void
}) {
  const patch = (partial: Partial<DraftPromises>) =>
    onChange({ ...value, ...partial })

  const updateItem = (index: number, partial: Partial<DraftPromiseItem>) => {
    const items = value.items.map((it, i) =>
      i === index ? { ...it, ...partial } : it
    )
    patch({ items })
  }

  return (
    <div className="space-y-4">
      <Text size="small" className="text-ui-fg-subtle">
        Trust bar under the hero — short promises like “Free delivery” or
        “100% cotton”. Up to {MAX_PROMISES} items. Each can use a library icon
        or your own upload. Disable to hide the bar from the layout.
      </Text>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="promises-enabled">Show promises bar</Label>
          <Text size="xsmall" className="text-ui-fg-muted block">
            Off hides this whole section on the homepage
          </Text>
        </div>
        <Switch
          id="promises-enabled"
          checked={value.enabled}
          onCheckedChange={(checked) => patch({ enabled: checked })}
        />
      </div>

      <div
        className={clx(
          "space-y-3 transition-opacity",
          !value.enabled && "pointer-events-none select-none opacity-40"
        )}
        aria-disabled={!value.enabled}
      >
        {value.items.map((item, i) => (
          <div
            key={item.key}
            className="border-ui-border-base space-y-3 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Text size="small" weight="plus">
                Promise {i + 1}
              </Text>
              <Button
                size="small"
                variant="transparent"
                type="button"
                disabled={!value.enabled || value.items.length <= MIN_PROMISES}
                onClick={() =>
                  patch({
                    items: value.items.filter((_, j) => j !== i),
                  })
                }
              >
                <XMarkMini />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-1">
                <ModePill
                  active={item.icon_mode === "preset"}
                  label="Library"
                  disabled={!value.enabled}
                  onClick={() =>
                    updateItem(i, {
                      icon_mode: "preset",
                      // keep last custom file in draft but stop using it
                    })
                  }
                />
                <ModePill
                  active={item.icon_mode === "custom"}
                  label="Custom"
                  disabled={!value.enabled}
                  onClick={() =>
                    updateItem(i, {
                      icon_mode: "custom",
                    })
                  }
                />
              </div>

              {item.icon_mode === "preset" ? (
                <div className="flex flex-wrap gap-1.5">
                  {PROMISE_ICONS.map(({ id, label, Icon }) => {
                    const active = item.icon === id
                    return (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        disabled={!value.enabled}
                        onClick={() =>
                          updateItem(i, {
                            icon: id,
                            icon_mode: "preset",
                          })
                        }
                        className={clx(
                          "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                          active
                            ? "border-ui-fg-base bg-ui-bg-base text-ui-fg-base"
                            : "border-ui-border-base text-ui-fg-muted hover:text-ui-fg-base",
                          !value.enabled && "cursor-not-allowed"
                        )}
                        aria-label={label}
                        aria-pressed={active}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <CustomIconUpload
                  url={item.icon_url}
                  fileName={item.icon_file_name}
                  disabled={!value.enabled}
                  onUploaded={(url, file_name) =>
                    updateItem(i, {
                      icon_mode: "custom",
                      icon_url: url,
                      icon_file_name: file_name,
                    })
                  }
                  onClear={() =>
                    updateItem(i, {
                      icon_url: undefined,
                      icon_file_name: undefined,
                    })
                  }
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Sub text</Label>
              <Input
                placeholder="e.g. Free delivery"
                value={item.text}
                disabled={!value.enabled}
                onChange={(e) => updateItem(i, { text: e.target.value })}
                maxLength={48}
              />
              <Text size="xsmall" className="text-ui-fg-muted">
                Short line under the icon (max 48 characters)
              </Text>
            </div>
          </div>
        ))}

        <Button
          size="small"
          variant="secondary"
          type="button"
          disabled={!value.enabled || value.items.length >= MAX_PROMISES}
          onClick={() => patch({ items: [...value.items, newItem()] })}
        >
          Add promise
          {value.items.length >= MAX_PROMISES
            ? ` (max ${MAX_PROMISES})`
            : ` (${value.items.length}/${MAX_PROMISES})`}
        </Button>
      </div>
    </div>
  )
}
