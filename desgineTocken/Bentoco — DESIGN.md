# Bentoco — DESIGN.md

Design token reference for Bentoco. Single warm-to-magenta palette, glassmorphic surfaces, motion-forward.

---

## 1. Color Palette

### Primary Scale

| Name    | Hex       | Swatch |
|---------|-----------|--------|
| Ember   | `#FF5A36` | 🟧 |
| Solar   | `#FF8A4C` | 🟧 |
| Crimson | `#F31B48` | 🟥 |
| Bloom   | `#FF3E74` | 🟪 |
| Blush   | `#F1D2D7` | 🩷 |
| Mist    | `#D9C5CF` | 🟪 |

Scale runs warm-orange → hot-pink/crimson → dusty neutral. Treat **Ember → Crimson** as the "hot" end (CTAs, emphasis) and **Blush / Mist** as the "quiet" end (backgrounds, muted surfaces).

### Foundation Color Scales

Each primary color expands into a full 50–900 tint/shade scale (500 = the base swatch above). Use these for hover/active states, tinted backgrounds, and text-on-tint pairings rather than adding opacity to the base color.

```css
/* Ember */
--color-ember-50:  #FFEFEB;
--color-ember-100: #FFCCC1;
--color-ember-200: #FFB3A3;
--color-ember-300: #FF9078;
--color-ember-400: #FF7B5E;
--color-ember-500: #FF5A36; /* base */
--color-ember-600: #E85231;
--color-ember-700: #B54026;
--color-ember-800: #8C321E;
--color-ember-900: #6B2617;

/* Solar */
--color-solar-50:  #FFF3ED;
--color-solar-100: #FFDBC8;
--color-solar-200: #FFC9AD;
--color-solar-300: #FFB187;
--color-solar-400: #FFA170;
--color-solar-500: #FF8A4C; /* base */
--color-solar-600: #E87E45;
--color-solar-700: #B56236;
--color-solar-800: #8C4C2A;
--color-solar-900: #6B3A20;

/* Crimson */
--color-crimson-50:  #FEE8ED;
--color-crimson-100: #FBB8C6;
--color-crimson-200: #F996AB;
--color-crimson-300: #F76684;
--color-crimson-400: #F5496D;
--color-crimson-500: #F31B48; /* base */
--color-crimson-600: #DD1942;
--color-crimson-700: #AD1333;
--color-crimson-800: #860F28;
--color-crimson-900: #660B1E;

/* Bloom */
--color-bloom-50:  #FFECF1;
--color-bloom-100: #FFC3D4;
--color-bloom-200: #FFA6BF;
--color-bloom-300: #FF7EA2;
--color-bloom-400: #FF6590;
--color-bloom-500: #FF3E74; /* base */
--color-bloom-600: #E8386A;
--color-bloom-700: #B52C52;
--color-bloom-800: #8C2240;
--color-bloom-900: #6B1A31;

/* Blush */
--color-blush-50:  #FEFBFB;
--color-blush-100: #FBF1F3;
--color-blush-200: #F9EAED;
--color-blush-300: #F6E1E4;
--color-blush-400: #F4DBDF;
--color-blush-500: #F1D2D7; /* base */
--color-blush-600: #DBBFC4;
--color-blush-700: #AB9599;
--color-blush-800: #857476;
--color-blush-900: #65585A;

/* Mist */
--color-mist-50:  #FBF9FA;
--color-mist-100: #F3EDF0;
--color-mist-200: #EEE4E9;
--color-mist-300: #E6D8DF;
--color-mist-400: #E1D1D9;
--color-mist-500: #D9C5CF; /* base */
--color-mist-600: #C5B3BC;
--color-mist-700: #9A8C93;
--color-mist-800: #776C72;
--color-mist-900: #5B5357;
```

`50`–`400` are lighter tints (tinted backgrounds, subtle fills, hover-on-light); `600`–`900` are darker shades (text-on-tint, borders, hover-on-dark). The semantic tokens below reference `-500` for each color unless noted otherwise.

### Semantic Tokens

**Dark theme is primary.** Light theme is the secondary/alt mode — build and QA dark first.

#### Dark Theme (Primary)

| Token                     | Value      | Usage |
|-----------------------------|------------|-------|
| `--color-bg-base`           | `#000000`  | Default app background |
| `--color-bg-surface`        | `#141414`  | Raised surfaces (cards, sheets) |
| `--color-bg-subtle`         | `#0A0A0A`  | Section backgrounds |
| `--color-bg-muted`          | `#1C1C1C`  | Dividers, disabled surfaces |
| `--color-text-primary`      | `#F5EDEF`  | Headline/body text on dark bg |
| `--color-text-secondary`    | `#C9B8BE`  | Muted/secondary text |
| `--color-text-inverse`      | `#000000`  | Text on light/saturated fills |
| `--color-accent-primary`    | `#FF5A36` (Ember)   | Primary buttons, links, active states |
| `--color-accent-hover`      | `#F31B48` (Crimson) | Hover/pressed states on accent |
| `--color-accent-secondary`  | `#FF8A4C` (Solar)   | Secondary CTAs, highlights |
| `--color-accent-tertiary`   | `#FF3E74` (Bloom)   | Tags, badges, notification dots |
| `--color-border-default`    | `rgba(255, 255, 255, 0.1)` | Card/input borders |
| `--color-border-strong`     | `#F31B48` (Crimson) | Focus rings, active borders |

#### Light Theme (Secondary)

| Token                     | Value      | Usage |
|-----------------------------|------------|-------|
| `--color-bg-base`           | `#FFFFFF`  | Default app background |
| `--color-bg-surface`        | `#FFF8F6`  | Raised surfaces (cards, sheets) |
| `--color-bg-subtle`         | `#F1D2D7` (Blush) | Section backgrounds |
| `--color-bg-muted`          | `#D9C5CF` (Mist)  | Dividers, disabled surfaces |
| `--color-text-primary`      | `#1A1A1A`  | Headline/body text on light bg |
| `--color-text-secondary`    | `#5C4A4E`  | Muted/secondary text |
| `--color-text-inverse`      | `#FFFFFF`  | Text on saturated/dark fills |
| `--color-accent-primary`    | `#FF5A36` (Ember)   | Primary buttons, links, active states |
| `--color-accent-hover`      | `#F31B48` (Crimson) | Hover/pressed states on accent |
| `--color-accent-secondary`  | `#FF8A4C` (Solar)   | Secondary CTAs, highlights |
| `--color-accent-tertiary`   | `#FF3E74` (Bloom)   | Tags, badges, notification dots |
| `--color-border-default`    | `#D9C5CF` (Mist)   | Card/input borders |
| `--color-border-strong`     | `#F31B48` (Crimson) | Focus rings, active borders |

#### Alert / Status Colors

Palette is monochromatic (warm orange → pink), so status colors are sourced outside it for clear differentiation. Same values on both themes; pair with each theme's `bg-subtle`/`text-primary` for the tinted-background variant.

| Token                     | Value      | Usage |
|-----------------------------|------------|-------|
| `--color-success`           | `#2FAE66`  | Success states, confirmations |
| `--color-warning`           | `#F2A93B`  | Warnings, caution states |
| `--color-info`              | `#3E8EF2`  | Informational messages |
| `--color-destructive`       | `#F31B48` (Crimson) | Errors, destructive actions — reuses palette |

---

## 2. Typography

| Role      | Font                     |
|-----------|---------------------------|
| Headline  | **Stack Sans Headline**   |
| Body/Text | **Stack Sans Text**       |
| Notes/Accent | **Permanent Marker**   |

- Headline font used for H1–H4, hero copy, and card titles.
- Text font used for body copy, labels, form inputs, and UI microcopy.
- Do not mix — headline weight/tracking is tuned for large sizes only.

### Type Scale

The underlying file is **Stack Sans Headline Regular** at every size — weight is applied via CSS `font-weight`, not a separate font file per weight (see mapping below).

| Size token | Font size | Line height | Tracking |
|------------|-----------|-------------|----------|
| `text-xs`   | 12px | 16px | 0px |
| `text-sm`   | 14px | 20px | 0px |
| `text-base` | 16px | 24px | 0px |
| `text-lg`   | 18px | 28px | 0px |
| `text-xl`   | 20px | 28px | 0px |

```css
--text-xs-size: 12px;   --text-xs-leading: 16px;
--text-sm-size: 14px;   --text-sm-leading: 20px;
--text-base-size: 16px; --text-base-leading: 24px;
--text-lg-size: 18px;   --text-lg-leading: 28px;
--text-xl-size: 20px;   --text-xl-leading: 28px;
/* tracking is 0px across the board — no --tracking-* token needed yet */
```

### Weight Mapping

Each size token above pairs with any of these weight suffixes (`text-{size}/{weight}`) via `font-weight`, font/size/line-height/tracking stay identical:

| Suffix       | `font-weight` |
|--------------|---------------|
| `thin`       | 100 |
| `extralight` | 200 |
| `light`      | 300 |
| `normal`     | 400 |
| `medium`     | 500 |
| `semibold`   | 600 |
| `bold`       | 700 |
| `extrabold`  | 800 |
| `black`      | 900 |

e.g. `text-sm/semibold` = Stack Sans Headline, 14px/20px, tracking 0px, `font-weight: 600`.

> Confirm Stack Sans Headline actually ships all 9 weights (100–900) — if it's a variable font this just works; if it's a static family, some weights may fall back to synthetic bold/thin in-browser.

### Notes Style

| Token | Font | Size | Line height | Tracking |
|-------|------|------|--------------|----------|
| `notes` | Permanent Marker Regular | 40px | auto | 0% |

Reserved for handwritten-style annotations/callouts — a distinct accent style, not part of the main type scale.

> **Incomplete:** the pasted spec cuts off at `text-xl/light` — `normal` through `black` for `text-xl`, and anything above `text-xl` (2xl, 3xl, headline sizes), aren't in yet. `text-xl/normal` → `text-xl/black` are assumed to follow the same 20px/28px/0px pattern as the rest of the row above (safe to extrapolate, since weight never changes size/line-height/tracking within a row). Paste the rest whenever you have it and I'll fill in the larger heading sizes.

---

## 3. Spacing

Tailwind's default spacing scale — 4px base unit.

| Token   | Value (px) | Token    | Value (px) |
|---------|------------|----------|------------|
| `0`     | 0          | `16`     | 64         |
| `px`    | 1          | `20`     | 80         |
| `0.5`   | 2          | `24`     | 96         |
| `1`     | 4          | `28`     | 112        |
| `1.5`   | 6          | `32`     | 128        |
| `2`     | 8          | `36`     | 144        |
| `2.5`   | 10         | `40`     | 160        |
| `3`     | 12         | `44`     | 176        |
| `3.5`   | 14         | `48`     | 192        |
| `4`     | 16         | `52`     | 208        |
| `5`     | 20         | `56`     | 224        |
| `6`     | 24         | `60`     | 240        |
| `7`     | 28         | `64`     | 256        |
| `8`     | 32         | `72`     | 288        |
| `9`     | 36         | `80`     | 320        |
| `10`    | 40         | `96`     | 384        |
| `11`    | 44         |          |            |
| `12`    | 48         |          |            |
| `14`    | 56         |          |            |

`--spacing-{token}` naming, e.g. `--spacing-4: 16px;`. Use as Tailwind's `p-4`, `gap-6`, `m-8` etc. — this is the stock Tailwind scale, unmodified.

---

## 4. Corner Radius

Stock Tailwind radius scale.

```css
--radius-none: 0px;
--radius-xs:   2px;
--radius-sm:   4px;
--radius-md:   6px;
--radius-lg:   8px;
--radius-xl:   12px;
--radius-2xl:  16px;
--radius-3xl:  24px;
--radius-4xl:  32px;
--radius-full: 9999px;
--theme-radius: var(--radius-md); /* default component radius */
```

> Reconciling with the earlier "5px small / 15px max" guideline: treat `--radius-sm` (4px) as the practical floor and `--radius-xl`–`--radius-2xl` (12–16px) as the practical ceiling for standard UI (buttons, inputs, cards). `--radius-3xl`/`--radius-4xl` and `--radius-full` are reserved for large hero surfaces, pills, and avatars — not general components.

---

## 5. Icons

- **Library:** Lucide Icons
- Keep stroke width consistent with Lucide defaults (2px) unless a specific weight is needed for emphasis.

---

## 6. Gradients

```css
/* Aurora — full spectrum, cool-to-hot */
--gradient-aurora: linear-gradient(135deg, #D9C5CF, #F1D2D7, #FF8A4C, #FF5A36, #F31B48);

/* Sunset — warm, orange-forward */
--gradient-sunset: linear-gradient(135deg, #FFB58A, #FF8A4C, #FF5A36, #F31B48);

/* Bloom — pink-forward */
--gradient-bloom: linear-gradient(135deg, #F1D2D7, #FF7A6A, #FF4E5F, #F31B48);
```

| Gradient | Best for |
|----------|----------|
| Aurora   | Hero backgrounds, full-bleed sections — widest color range |
| Sunset   | CTA buttons, banners — warm/energetic |
| Bloom    | Cards, badges, soft accents — pink-forward, gentler |

All gradients run at **135deg**. Keep this angle consistent across the product unless a component explicitly needs a directional variant.

---

## 7. Surface Effect

**Glassmorphic + Fractural Glass — marketing site only.** The main product app does not use these techniques; it stays on Tailwind CSS variables for any glass/blur styling (simple `backdrop-blur` utilities, no canvas/shader work).

For the marketing site, implement fractural glass using **one** of the following, in priority order:

1. **HTML in Canvas** ([Chrome origin trial](https://developer.chrome.com/blog/html-in-canvas-origin-trial)) — preferred where browser support allows. Must ship with a CSS fallback (standard `backdrop-filter: blur()` glass) for browsers without the feature.
2. **WebGL Shader** — fallback approach when HTML-in-Canvas isn't a reliable option (browser support, performance budget, etc.). Use for the faceted/fractural refraction look that plain CSS blur can't achieve.

```css
/* CSS fallback — used if HTML-in-Canvas is unsupported, and as the baseline for the main app */
.glass-surface {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(243, 27, 72, 0.15); /* tint shadow with Crimson */
}
```

Tint the blur/shadow with palette colors (Crimson/Ember at low opacity) rather than pure black, to keep the glass feeling warm rather than cold.

| Surface | Technique |
|---------|-----------|
| Marketing site | HTML-in-Canvas (+ CSS fallback) → or WebGL Shader if HTML-in-Canvas isn't reliable |
| Main app | Tailwind CSS variables only — no canvas/shader |

---

## 8. Elevation & Blur Tokens (CSS-only)

These are pure CSS tokens (`box-shadow` / `filter` / `backdrop-filter`) — for the main app and any place using Tailwind CSS variables, not the canvas/shader marketing effects above.

### Drop Shadows

```css
--shadow-2xs: 0px 1px 0px #0000000D;
--shadow-xs:  0px 1px 2px #0000000D;
--shadow-sm:  0px 1px 2px #0000000F, 0px 1px 3px #0000001A;
--shadow-md:  0px 2px 4px #0000000F, 0px 4px 6px #0000001A;
--shadow-lg:  0px 4px 6px #0000000D, 0px 10px 15px #0000001A;
--shadow-xl:  0px 10px 10px #0000000A, 0px 20px 25px #0000001A;
--shadow-2xl: 0px 25px 50px #00000040;
--shadow-none: none;
```

### Inner Shadows

```css
--inner-shadow-2xs: inset 0px 1px 0px #0000000D;
--inner-shadow-xs:  inset 0px 1px 1px #0000000D;
--inner-shadow-sm:  inset 0px 2px 4px #0000000D;
```

Apply inner shadows via `box-shadow` as well — just prefix with `inset`; no separate CSS property needed.

### Layer Blur (`filter: blur()`)

```css
--blur-none: blur(0px);
--blur-xs:   blur(4px);
--blur-sm:   blur(8px);
--blur-md:   blur(12px);
--blur-lg:   blur(16px);
--blur-xl:   blur(24px);
--blur-2xl:  blur(40px);
--blur-3xl:  blur(64px);
```

### Backdrop Blur (`backdrop-filter: blur()`)

```css
--backdrop-blur-none: blur(0px);
--backdrop-blur-xs:   blur(4px);
--backdrop-blur-sm:   blur(8px);
--backdrop-blur-md:   blur(12px);
--backdrop-blur-lg:   blur(16px);
--backdrop-blur-xl:   blur(24px);
--backdrop-blur-2xl:  blur(40px);
--backdrop-blur-3xl:  blur(64px);
```

Usage: `backdrop-filter: var(--backdrop-blur-md);` (pair with `-webkit-backdrop-filter` for Safari). Colors above are 8-digit hex (`#RRGGBBAA`) — supported directly in modern CSS `box-shadow`/`background` without converting to `rgba()`.

---

## 9. Motion

| Tool           | Scope |
|----------------|-------|
| **Framer Motion** | Product UI — component transitions, page/state animation |
| **GSAP**          | Marketing pages only — scroll-driven, hero, landing-page animation |
| **SVG animation** | Loading screens |

Keep Framer Motion and GSAP scoped to their lanes (product vs. marketing) to avoid double-driving the same elements with two animation engines.

### Motion Tokens

Opacity scale for fades/enter-exit transitions (stock Tailwind opacity scale, in %):

```css
--opacity-0: 0;
--opacity-5: 0.05;
--opacity-10: 0.1;
--opacity-15: 0.15;
--opacity-20: 0.2;
--opacity-25: 0.25;
--opacity-30: 0.3;
--opacity-35: 0.35;
--opacity-40: 0.4;
--opacity-45: 0.45;
--opacity-50: 0.5;
--opacity-55: 0.55;
--opacity-60: 0.6;
--opacity-65: 0.65;
--opacity-70: 0.7;
--opacity-75: 0.75;
--opacity-80: 0.8;
--opacity-85: 0.85;
--opacity-90: 0.9;
--opacity-95: 0.95;
--opacity-100: 1;
```

Blur scale for blur-in/blur-out transitions — same values as `--blur-*` in [Elevation & Blur Tokens](#8-elevation--blur-tokens-css-only); reuse those tokens rather than duplicating a second set. Typical use: fade+blur enter animation on modals/tooltips animates `opacity` 0→1 alongside `filter: var(--blur-md)` → `blur(0px)`.

---

## 10. Open Items

- [ ] None outstanding — spacing, radius, elevation/blur, and motion tokens are now all defined. Revisit if new component categories need their own scale.
