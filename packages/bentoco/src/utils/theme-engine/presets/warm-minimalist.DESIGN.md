---
version: alpha
name: Warm Minimalist
description: "Bentoco storefront preset v1 — soft neutrals, clay accent, calm commerce. Single premade layout skin."
colors:
  background: "#F7F5F2"
  foreground: "#1A1C1E"
  card: "#FFFFFF"
  card-foreground: "#1A1C1E"
  popover: "#FFFFFF"
  popover-foreground: "#1A1C1E"
  primary: "#1A1C1E"
  on-primary: "#F7F5F2"
  primary-foreground: "#F7F5F2"
  secondary: "#EDE9E3"
  on-secondary: "#1A1C1E"
  secondary-foreground: "#1A1C1E"
  muted: "#EDE9E3"
  muted-foreground: "#6C7278"
  accent: "#B8422E"
  on-accent: "#FFFFFF"
  accent-foreground: "#FFFFFF"
  tertiary: "#B8422E"
  destructive: "#B42318"
  error: "#B42318"
  border: "#E4DFD7"
  input: "#E4DFD7"
  ring: "#B8422E"
  neutral: "#F7F5F2"
  surface: "#FFFFFF"
  on-surface: "#1A1C1E"
typography:
  display:
    fontFamily: "DM Sans"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  h1:
    fontFamily: "DM Sans"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
  body:
    fontFamily: "DM Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "DM Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  highlight:
    fontFamily: "DM Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.02em
  label-md:
    fontFamily: "DM Sans"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.06em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: 12px
---

# Warm Minimalist

Bentoco storefront vibe preset. Token skin for the **default** premade layout only.

## Overview

Calm, gallery-like commerce: warm limestone backgrounds, deep ink type, and a single clay accent for actions. Feels premium without visual noise — suited to Indian D2C catalogs that need trust and speed over decoration.

## Colors

- **Background / neutral (#F7F5F2):** Warm limestone page ground (softer than pure white).
- **Foreground / primary ink (#1A1C1E):** Headlines, body, primary text.
- **Accent / tertiary (#B8422E):** Boston clay — CTAs, links, focus ring only.
- **Muted slate (#6C7278):** Captions, meta, secondary labels.
- **Card (#FFFFFF):** Raised product cards and sheets on the warm ground.

## Typography

**DM Sans** for display, body, and highlight roles in v1 (one family keeps load light on mobile 4G). Display is semi-bold with tight tracking; body is regular 16px; highlight/labels are medium weight for prices and badges.

## Layout

Fixed storefront shell (`layout_id: default`): home, collection, product, cart, checkout. Spacing follows an 8px rhythm (`sm`/`md`/`lg`). Content max-width is defined by the layout template, not this file.

## Elevation & Depth

Prefer tonal layers (white cards on limestone) over heavy shadows. Borders use `border` token; avoid large drop shadows on product grids.

## Shapes

Default corner language is **medium (8px)** via `rounded.md`. Config Editor radius steps 0–4 map across `none` → `sm` → `md` → `lg` → `xl`/`full`.

## Components

- **Primary button:** Clay accent fill, light text, medium radius.
- **Inputs:** White surface, subtle border, small radius.
- Product cards inherit card surface + border; no special chrome beyond tokens.

## Do's and Don'ts

- Do use accent only for the primary action per view.
- Don't introduce a second accent hue without updating this DESIGN.md.
- Do keep body text on background/card at WCAG AA contrast.
- Don't change page structure here — layout is the premade template; this file only skins it.
