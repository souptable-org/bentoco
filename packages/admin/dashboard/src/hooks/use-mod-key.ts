import * as React from "react"

/**
 * Platform-aware modifier key label for shortcuts.
 * macOS → "⌘", Windows/Linux → "Ctrl"
 */
export function useModKey(): "⌘" | "Ctrl" {
  const [mod, setMod] = React.useState<"⌘" | "Ctrl">(() => {
    if (typeof navigator === "undefined") {
      return "Ctrl"
    }
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
      ? "⌘"
      : "Ctrl"
  })

  React.useEffect(() => {
    setMod(
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
        ? "⌘"
        : "Ctrl"
    )
  }, [])

  return mod
}

export function getModKeyLabel(): "⌘" | "Ctrl" {
  if (typeof navigator === "undefined") {
    return "Ctrl"
  }
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
    ? "⌘"
    : "Ctrl"
}
