import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Badge, Button, Container, Text, toast, clx } from "@bentoco/ui"
import {
  ArrowPath,
  CheckCircleSolid,
  ArrowDownTray,
  XMark,
} from "@bentoco/icons"

import {
  useStoreTheme,
  useUpdateStoreTheme,
  type StoreThemeConfig,
} from "../../hooks/api/store-theme"
import { SingleColumnPageSkeleton } from "../../components/common/skeleton"
import { ImportDesignMdModal } from "./components/import-design-md-modal"

import { storefrontPreviewUrl } from "../../lib/storefront-preview"

type LibraryRow = {
  id: string
  name: string
  description?: string
  source: "preset" | "active" | "import"
  design_md?: string
  isActive: boolean
}

export const StoreThemePage = () => {
  const { theme, isPending, isError, error, refetch } = useStoreTheme()
  const { mutateAsync: updateTheme, isPending: isUpdating } =
    useUpdateStoreTheme()

  const [importOpen, setImportOpen] = useState(false)
  const [iframeKey, setIframeKey] = useState(() => Date.now())

  const config = theme?.theme_config
  const activeId = config?.active_theme_id
  const activeName = config?.tokens?.name || activeId || "Theme"
  const previewTenantId = theme?.tenant_id || null
  const previewSrc = useMemo(
    () =>
      storefrontPreviewUrl({
        path: "/",
        cacheBust: iframeKey,
        tenantId: previewTenantId,
      }),
    [iframeKey, previewTenantId]
  )

  const libraryRows: LibraryRow[] = useMemo(() => {
    const presets = theme?.presets || []
    const rows: LibraryRow[] = presets.map((p) => ({
      id: p.id,
      name: p.name,
      source: "preset" as const,
      isActive: p.id === activeId,
      description:
        p.id === activeId
          ? config?.tokens?.description
          : "Builtin Bentoco vibe preset",
    }))

    if (activeId && !presets.some((p) => p.id === activeId) && config) {
      rows.unshift({
        id: activeId,
        name: activeName,
        source: "import",
        isActive: true,
        design_md: config.design_md,
        description: config.tokens?.description || "Imported DESIGN.md theme",
      })
    }

    return rows
  }, [theme?.presets, activeId, activeName, config])

  if (isPending) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  if (isError) {
    throw error
  }

  const handleInstall = async (themeId: string) => {
    try {
      await updateTheme({ install_preset: themeId })
      toast.success(`Installed theme: ${themeId}`)
      await refetch()
    } catch (err: any) {
      toast.error(err?.message || "Failed to install theme")
    }
  }

  const handleDownload = (row?: LibraryRow) => {
    const md =
      row?.design_md ||
      (row?.id === activeId ? config?.design_md : undefined) ||
      config?.design_md
    if (!md) {
      toast.error("No DESIGN.md available to download")
      return
    }
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${row?.id || activeId || "theme"}.DESIGN.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded DESIGN.md")
  }

  const handleRemove = async (row: LibraryRow) => {
    if (row.source === "preset" && !row.isActive) {
      toast.info(
        "Builtin presets stay in the catalog. Install another theme to switch."
      )
      return
    }
    try {
      await updateTheme({ install_preset: "warm-minimalist" })
      toast.success("Reset active theme to Warm Minimalist")
      await refetch()
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove / reset theme")
    }
  }

  const handleImport = async (payload: {
    theme_id: string
    design_md: string
  }) => {
    await updateTheme({
      design_md: payload.design_md,
      theme_id: payload.theme_id,
    })
    await refetch()
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-y-8 py-2">
      {/* Live storefront preview — same iframe URL as /store/editor */}
      <div className="overflow-hidden rounded-xl border border-ui-border-base">
        <div className="relative h-[320px] w-full border-b border-ui-border-base bg-ui-bg-subtle">
          {previewTenantId ? (
            <iframe
              key={`${iframeKey}-${previewTenantId}`}
              title="Storefront preview"
              src={previewSrc}
              className="h-full w-full border-0 bg-ui-bg-base"
            />
          ) : (
            <div className="text-ui-fg-muted flex h-full items-center justify-center text-sm">
              Waiting for tenant theme…
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 bg-ui-bg-base px-5 py-3">
          <div className="flex items-center gap-3">
            <Text weight="plus" leading="compact" className="truncate">
              theme: {activeName}
            </Text>
            {theme?.theme_config?.draft ? (
              <Badge color="orange" size="small">
                Unpublished draft
              </Badge>
            ) : (
              <Badge color="green" size="small">
                Published
              </Badge>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                const liveUrl = previewSrc.replace(/[?&]preview=1/, "")
                window.open(liveUrl, "_blank")
              }}
              title="Open live storefront in new tab"
            >
              Open live ↗
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setIframeKey(Date.now())}
              title="Refresh preview"
            >
              <ArrowPath className="mr-1" />
              Refresh
            </Button>
            <Button variant="secondary" size="small" asChild>
              <Link to="/store/editor">EDITOR</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Themes library */}
      <div className="flex flex-col gap-y-3">
        <div className="flex items-center justify-between gap-4">
          <Text weight="plus" size="large" leading="compact">
            Themes
          </Text>
          <div className="flex items-center gap-2">
            <span
              className={clx(
                "rounded-md border border-ui-fg-base bg-ui-bg-base px-3 py-1.5 text-sm font-medium text-ui-fg-base"
              )}
            >
              Themes
            </span>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setImportOpen(true)}
            >
              import
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          {libraryRows.length === 0 ? (
            <Container className="p-8 text-center text-sm text-ui-fg-subtle">
              No themes in library. Use{" "}
              <button
                type="button"
                className="text-ui-fg-interactive underline"
                onClick={() => setImportOpen(true)}
              >
                import
              </button>{" "}
              to add a DESIGN.md.
            </Container>
          ) : (
            libraryRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-4 rounded-xl border border-ui-border-base bg-ui-bg-base px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Text weight="plus" leading="compact">
                      theme: {row.name}
                    </Text>
                    {row.isActive && (
                      <Badge color="green" size="2xsmall">
                        Active
                      </Badge>
                    )}
                  </div>
                  {row.description && (
                    <Text
                      size="small"
                      className="mt-0.5 truncate text-ui-fg-subtle"
                    >
                      {row.description}
                    </Text>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="small"
                    variant="transparent"
                    disabled={row.isActive || isUpdating}
                    onClick={() => handleInstall(row.id)}
                    title="Install"
                  >
                    <CheckCircleSolid
                      className={clx(
                        "text-ui-tag-green-icon",
                        row.isActive && "opacity-40"
                      )}
                    />
                  </Button>
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() => handleDownload(row)}
                    title="Download"
                  >
                    <ArrowDownTray className="text-ui-tag-orange-icon" />
                  </Button>
                  <Button
                    size="small"
                    variant="transparent"
                    disabled={isUpdating}
                    onClick={() => handleRemove(row)}
                    title="Remove"
                  >
                    <XMark className="text-ui-tag-red-icon" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ImportDesignMdModal
        open={importOpen}
        onOpenChange={setImportOpen}
        isImporting={isUpdating}
        onImport={handleImport}
      />
    </div>
  )
}

export type { StoreThemeConfig }
