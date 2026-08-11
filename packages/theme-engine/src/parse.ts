import type { DesignMdTokens, DesignMdTypography } from "./types"

export type ParseDesignMdResult = {
  tokens: DesignMdTokens
  body: string
}

/**
 * Minimal YAML front-matter parser for Google DESIGN.md token subset.
 * Supports maps, nested maps (typography), strings, numbers, arrays of strings.
 * Not a full YAML implementation — enough for theme tokens we ship.
 */
export function parseDesignMd(source: string): ParseDesignMdResult {
  const normalized = source.replace(/^\uFEFF/, "")
  if (!normalized.startsWith("---")) {
    throw new Error("DESIGN.md must start with YAML front matter (---)")
  }

  const end = normalized.indexOf("\n---", 3)
  if (end === -1) {
    throw new Error("DESIGN.md front matter is not closed with ---")
  }

  const yamlBlock = normalized.slice(4, end).replace(/^\r?\n/, "")
  const body = normalized.slice(end + 4).replace(/^\r?\n/, "")

  const root = parseYamlMap(yamlBlock)
  if (!root.name || typeof root.name !== "string") {
    throw new Error("DESIGN.md front matter requires a string `name`")
  }

  const tokens: DesignMdTokens = {
    name: root.name as string,
  }

  if (typeof root.version === "string") tokens.version = root.version
  if (typeof root.description === "string") tokens.description = root.description
  if (root.colors && typeof root.colors === "object") {
    tokens.colors = stringifyMap(root.colors as Record<string, unknown>)
  }
  if (root.typography && typeof root.typography === "object") {
    tokens.typography = parseTypographyMap(
      root.typography as Record<string, unknown>
    )
  }
  if (root.rounded && typeof root.rounded === "object") {
    tokens.rounded = stringifyMap(root.rounded as Record<string, unknown>)
  }
  if (root.spacing && typeof root.spacing === "object") {
    tokens.spacing = parseSpacingMap(root.spacing as Record<string, unknown>)
  }
  if (root.components && typeof root.components === "object") {
    tokens.components = parseComponentsMap(
      root.components as Record<string, unknown>
    )
  }
  if (Array.isArray(root.omitted)) {
    tokens.omitted = root.omitted as DesignMdTokens["omitted"]
  }

  return { tokens, body }
}

function stringifyMap(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue
    if (typeof v === "object") continue
    out[k] = String(v)
  }
  return out
}

function parseSpacingMap(
  obj: Record<string, unknown>
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "number") out[k] = v
    else if (v !== null && v !== undefined && typeof v !== "object") {
      out[k] = String(v)
    }
  }
  return out
}

function parseTypographyMap(
  obj: Record<string, unknown>
): Record<string, DesignMdTypography> {
  const out: Record<string, DesignMdTypography> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (!val || typeof val !== "object" || Array.isArray(val)) continue
    const t = val as Record<string, unknown>
    if (typeof t.fontFamily !== "string") continue
    const entry: DesignMdTypography = { fontFamily: t.fontFamily }
    if (t.fontSize != null) entry.fontSize = String(t.fontSize)
    if (t.fontWeight != null) entry.fontWeight = t.fontWeight as number | string
    if (t.lineHeight != null) entry.lineHeight = t.lineHeight as number | string
    if (t.letterSpacing != null) entry.letterSpacing = String(t.letterSpacing)
    if (typeof t.fontFeature === "string") entry.fontFeature = t.fontFeature
    if (typeof t.fontVariation === "string")
      entry.fontVariation = t.fontVariation
    out[key] = entry
  }
  return out
}

function parseComponentsMap(
  obj: Record<string, unknown>
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  for (const [comp, props] of Object.entries(obj)) {
    if (!props || typeof props !== "object" || Array.isArray(props)) continue
    out[comp] = stringifyMap(props as Record<string, unknown>)
  }
  return out
}

/** Indentation-aware map parser for simple YAML. */
function parseYamlMap(yaml: string): Record<string, unknown> {
  const lines = yaml.split(/\r?\n/)
  let i = 0

  function peekIndent(line: string): number {
    const m = line.match(/^(\s*)/)
    return m ? m[1].length : 0
  }

  function parseBlock(minIndent: number): Record<string, unknown> {
    const obj: Record<string, unknown> = {}
    while (i < lines.length) {
      const raw = lines[i]
      if (!raw.trim() || raw.trim().startsWith("#")) {
        i++
        continue
      }
      const indent = peekIndent(raw)
      if (indent < minIndent) break
      if (indent > minIndent && minIndent > 0) {
        // continuation handled by nested parse
        break
      }

      const line = raw.slice(indent)
      const colon = line.indexOf(":")
      if (colon === -1) {
        i++
        continue
      }

      const key = unquote(line.slice(0, colon).trim())
      const rest = line.slice(colon + 1).trim()
      i++

      if (rest === "" || rest === "|" || rest === ">") {
        // Nested map or empty
        if (i < lines.length && peekIndent(lines[i]) > indent) {
          obj[key] = parseBlock(indent + 2)
        } else {
          obj[key] = ""
        }
      } else if (rest.startsWith("-")) {
        // inline list start — rare; treat as string
        obj[key] = parseScalar(rest)
      } else {
        obj[key] = parseScalar(rest)
      }
    }
    return obj
  }

  return parseBlock(0)
}

function parseScalar(raw: string): string | number | boolean {
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1)
  }
  if (raw === "true") return true
  if (raw === "false") return false
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}

function unquote(s: string): string {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1)
  }
  return s
}
