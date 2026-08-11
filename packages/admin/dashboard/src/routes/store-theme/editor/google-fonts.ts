/**
 * Google Fonts catalog for Theme Config Editor.
 *
 * Primary source: Fontsource public API (Google-origin fonts, no API key).
 * Fallback: large static list of popular Google families so the picker always works offline.
 */

const FONTSOURCE_URL = "https://api.fontsource.org/v1/fonts"

/** Always available system / web-safe options (not from Google). */
export const SYSTEM_FONT_OPTIONS = [
  "system-ui",
  "ui-sans-serif",
  "Georgia",
  "Times New Roman",
  "ui-serif",
  "ui-monospace",
] as const

/**
 * Popular Google Fonts fallback when the remote catalog cannot be fetched.
 * Enough variety for display / body / accent roles without an API key.
 */
export const GOOGLE_FONTS_FALLBACK: string[] = [
  "ABeeZee",
  "Abel",
  "Abril Fatface",
  "Acme",
  "Alegreya",
  "Alegreya Sans",
  "Alfa Slab One",
  "Alice",
  "Amatic SC",
  "Anton",
  "Archivo",
  "Archivo Black",
  "Archivo Narrow",
  "Arimo",
  "Arvo",
  "Asap",
  "Assistant",
  "Barlow",
  "Barlow Condensed",
  "Barlow Semi Condensed",
  "Be Vietnam Pro",
  "Bebas Neue",
  "Bitter",
  "Bodoni Moda",
  "Bricolage Grotesque",
  "Cabin",
  "Cairo",
  "Cardo",
  "Catamaran",
  "Caveat",
  "Chivo",
  "Cinzel",
  "Comfortaa",
  "Commissioner",
  "Cormorant",
  "Cormorant Garamond",
  "Crimson Pro",
  "Crimson Text",
  "DM Mono",
  "DM Sans",
  "DM Serif Display",
  "DM Serif Text",
  "Dancing Script",
  "Darker Grotesque",
  "Domine",
  "Dosis",
  "EB Garamond",
  "Epilogue",
  "Exo 2",
  "Figtree",
  "Fira Code",
  "Fira Sans",
  "Fjalla One",
  "Fraunces",
  "Fredoka",
  "Geist",
  "Geist Mono",
  "Gelasio",
  "Gloria Hallelujah",
  "Gothic A1",
  "Great Vibes",
  "Hanken Grotesk",
  "Heebo",
  "Hind",
  "IBM Plex Mono",
  "IBM Plex Sans",
  "IBM Plex Sans Arabic",
  "IBM Plex Serif",
  "Inconsolata",
  "Instrument Sans",
  "Instrument Serif",
  "Inter",
  "Inter Tight",
  "Josefin Sans",
  "Josefin Slab",
  "Jost",
  "Kalam",
  "Kanit",
  "Karla",
  "Kaushan Script",
  "Lato",
  "League Spartan",
  "Lexend",
  "Lexend Deca",
  "Libre Baskerville",
  "Libre Franklin",
  "Literata",
  "Lora",
  "Manrope",
  "Martel",
  "Maven Pro",
  "Merriweather",
  "Merriweather Sans",
  "Montserrat",
  "Montserrat Alternates",
  "Mukta",
  "Mulish",
  "Nanum Gothic",
  "Neuton",
  "Newsreader",
  "Noto Color Emoji",
  "Noto Sans",
  "Noto Sans Arabic",
  "Noto Sans Devanagari",
  "Noto Sans Display",
  "Noto Sans Mono",
  "Noto Serif",
  "Noto Serif Display",
  "Nunito",
  "Nunito Sans",
  "Old Standard TT",
  "Onest",
  "Open Sans",
  "Orbitron",
  "Oswald",
  "Outfit",
  "Overpass",
  "Oxygen",
  "PT Sans",
  "PT Serif",
  "Pacifico",
  "Passion One",
  "Pattaya",
  "Paytone One",
  "Permanent Marker",
  "Philosopher",
  "Playfair Display",
  "Plus Jakarta Sans",
  "Poppins",
  "Prata",
  "Prompt",
  "Public Sans",
  "Quicksand",
  "Rajdhani",
  "Raleway",
  "Readex Pro",
  "Red Hat Display",
  "Red Hat Text",
  "Righteous",
  "Roboto",
  "Roboto Condensed",
  "Roboto Flex",
  "Roboto Mono",
  "Roboto Serif",
  "Roboto Slab",
  "Rokkitt",
  "Rubik",
  "Russo One",
  "Sacramento",
  "Saira",
  "Sarabun",
  "Schibsted Grotesk",
  "Secular One",
  "Signika",
  "Sora",
  "Source Code Pro",
  "Source Sans 3",
  "Source Serif 4",
  "Space Grotesk",
  "Space Mono",
  "Spectral",
  "Spline Sans",
  "Syne",
  "Tajawal",
  "Teko",
  "Titillium Web",
  "Ubuntu",
  "Ubuntu Mono",
  "Unbounded",
  "Urbanist",
  "Varela Round",
  "Vollkorn",
  "Work Sans",
  "Yanone Kaffeesatz",
  "Yeseva One",
  "Zilla Slab",
]

let catalogCache: string[] | null = null
let catalogPromise: Promise<string[]> | null = null

export type GoogleFontsCatalog = {
  families: string[]
  source: "fontsource" | "fallback"
}

/**
 * Load Google Font family names (full catalog when network allows).
 */
export async function loadGoogleFontsCatalog(): Promise<GoogleFontsCatalog> {
  if (catalogCache) {
    return { families: catalogCache, source: "fontsource" }
  }
  if (!catalogPromise) {
    catalogPromise = fetchFontsourceGoogleFamilies()
      .then((families) => {
        catalogCache = families
        return families
      })
      .catch(() => {
        catalogCache = [...GOOGLE_FONTS_FALLBACK]
        return catalogCache
      })
  }
  const families = await catalogPromise
  return {
    families,
    source:
      families.length > GOOGLE_FONTS_FALLBACK.length ? "fontsource" : "fallback",
  }
}

async function fetchFontsourceGoogleFamilies(): Promise<string[]> {
  const res = await fetch(FONTSOURCE_URL, {
    // catalog is public & cacheable
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Fontsource HTTP ${res.status}`)
  }
  const data = (await res.json()) as Array<{
    family?: string
    type?: string
  }>
  if (!Array.isArray(data)) {
    throw new Error("Unexpected fontsource payload")
  }

  // Prefer Google-sourced entries; if type missing, keep all named families
  const names = new Set<string>()
  for (const item of data) {
    if (!item?.family) continue
    if (item.type && item.type !== "google") continue
    names.add(item.family)
  }

  // If filter was too aggressive, fall back to all families
  if (names.size < 50) {
    for (const item of data) {
      if (item?.family) names.add(item.family)
    }
  }

  const list = Array.from(names).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  )
  if (list.length < 50) {
    throw new Error("Font catalog too small")
  }
  return list
}

/** Whether a family should be loaded from fonts.googleapis.com */
export function isGoogleWebFont(family: string): boolean {
  const f = family.trim()
  if (!f) return false
  return !(SYSTEM_FONT_OPTIONS as readonly string[]).includes(f)
}

/**
 * Inject a <link> for previewing a Google Font in the admin editor.
 */
export function ensureGoogleFontPreviewStylesheet(family: string): void {
  if (typeof document === "undefined" || !isGoogleWebFont(family)) return

  const id = `gf-preview-${family.replace(/\s+/g, "-").toLowerCase()}`
  if (document.getElementById(id)) return

  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  ).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`

  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = href
  document.head.appendChild(link)
}

export function filterFontFamilies(
  families: string[],
  query: string,
  limit = 80
): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return families.slice(0, limit)
  const starts: string[] = []
  const includes: string[] = []
  for (const f of families) {
    const lower = f.toLowerCase()
    if (lower.startsWith(q)) starts.push(f)
    else if (lower.includes(q)) includes.push(f)
  }
  return [...starts, ...includes].slice(0, limit)
}
