import { useRef, useState } from "react"
import { Button, FocusModal, Input, Text, toast } from "@bentoco/ui"

type ImportDesignMdModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isImporting?: boolean
  onImport: (payload: {
    theme_id: string
    design_md: string
  }) => Promise<void>
}

/**
 * Modal for importing a Google-format DESIGN.md theme pack.
 * Built with FocusModal (Radix Dialog — same primitive family as shadcn Dialog).
 */
export const ImportDesignMdModal = ({
  open,
  onOpenChange,
  isImporting,
  onImport,
}: ImportDesignMdModalProps) => {
  const [importName, setImportName] = useState("")
  const [importText, setImportText] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setImportName("")
    setImportText("")
    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset()
    }
    onOpenChange(next)
  }

  const onFile = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    setImportText(text)
    if (!importName) {
      setImportName(
        file.name.replace(/\.md$/i, "").replace(/\.DESIGN$/i, "")
      )
    }
  }

  const handleSubmit = async () => {
    const design_md = importText.trim()
    if (!design_md.startsWith("---")) {
      toast.error("DESIGN.md must start with YAML front matter (---)")
      return
    }
    const theme_id =
      importName.trim().toLowerCase().replace(/\s+/g, "-") ||
      `import-${Date.now()}`

    try {
      await onImport({ theme_id, design_md })
      toast.success("Theme imported and set as active")
      handleOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to import DESIGN.md")
    }
  }

  return (
    <FocusModal open={open} onOpenChange={handleOpenChange}>
      <FocusModal.Content
        portalProps={{
          container:
            typeof document !== "undefined" ? document.body : undefined,
        }}
        className="!inset-auto !left-1/2 !top-1/2 !h-auto !max-h-[min(90vh,720px)] !w-[min(100%-2rem,560px)] !-translate-x-1/2 !-translate-y-1/2"
      >
        <FocusModal.Header>
          <div className="flex flex-1 items-center justify-end gap-x-2">
            <FocusModal.Close asChild>
              <Button size="small" variant="secondary" type="button">
                Cancel
              </Button>
            </FocusModal.Close>
            <Button
              size="small"
              type="button"
              isLoading={isImporting}
              disabled={!importText.trim() || isImporting}
              onClick={handleSubmit}
            >
              Import & install
            </Button>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-y-5">
            <div className="space-y-1">
              <FocusModal.Title className="txt-compact-xlarge-plus text-ui-fg-base">
                Import DESIGN.md
              </FocusModal.Title>
              <FocusModal.Description className="text-ui-fg-subtle text-sm">
                Upload or paste a Google-format DESIGN.md (YAML front matter +
                prose). It will be compiled and set as the active storefront
                theme.
              </FocusModal.Description>
            </div>

            <div className="space-y-1.5">
              <Text size="small" weight="plus" leading="compact">
                Theme id / name
              </Text>
              <Input
                placeholder="my-brand-theme"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
              />
              <Text size="xsmall" className="text-ui-fg-muted">
                Used as the theme id (lowercase, hyphenated).
              </Text>
            </div>

            <div className="space-y-1.5">
              <Text size="small" weight="plus" leading="compact">
                DESIGN.md file
              </Text>
              <label
                className="border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 transition-colors"
              >
                <Text size="small" weight="plus">
                  Choose file
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  .md or .DESIGN.md
                </Text>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".md,text/markdown,text/plain"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <Text size="small" weight="plus" leading="compact">
                Or paste contents
              </Text>
              <textarea
                className="border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-ui-border-interactive min-h-[200px] w-full resize-y rounded-md border p-3 font-mono text-xs outline-none focus:outline-none"
                placeholder={`---\nversion: alpha\nname: My Theme\ncolors:\n  primary: "#111111"\n  accent: "#B8422E"\n---\n\n## Overview\n...`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
