---
target: sidebar collapsed (icon mode)
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-31T11-27-16Z
slug: ges-admin-dashboard-src-components-app-sidebar-tsx
---
Method: dual-agent (A: 019fb7eb-dc3a-7c00-be04-3000b644811d · B: 019fb7eb-dc49-7270-b80d-0b8c0fcccc68)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Active nav OK; active store identity invisible without hover |
| 2 | Match System / Real World | 2 | Dual Store icons; Gift→Referral weak |
| 3 | User Control and Freedom | 3 | ⌘B / trigger / expand OK |
| 4 | Consistency and Standards | 1 | Tooltips on brand/CTA/switcher but not main nav |
| 5 | Error Prevention | 2 | Store-icon collision invites wrong destination |
| 6 | Recognition Rather Than Recall | 1 | Icon-only nav without tooltips is pure recall |
| 7 | Flexibility and Efficiency | 3 | Cookie collapse, ⌘B, palette, zero-delay tooltips where present |
| 8 | Aesthetic and Minimalist Design | 3 | Quiet 3rem rail; clipped brand text is the wart |
| 9 | Error Recovery | 2 | Wrong page recoverable; accidental merchant tab heavier |
| 10 | Help and Documentation | 2 | ⌘B hint; nav meanings undocumented on hover |
| **Total** | | **21/40** | **Weak / Needs work** |

#### Design Specificity Verdict

**LLM:** Partially specific, mostly generic shadcn rail. Store switcher collapse is intentional (agency multi-store). Nav is stock Lucide stack; two Store metaphors compete; brand collapses via clip not hide; active store not encoded on the icon.

**Deterministic scan:** detect.mjs on app-sidebar, nav-group, agency-store-switcher, ui/sidebar → `[]` exit 0. No anti-pattern hits. Clean scan ≠ usable collapsed mode.

**Visual overlays:** Browser visualization skipped (no automation).

#### Overall Impression

Chassis is solid (width, inset, keyboard, cookie, switcher hide rules). Labeling contract is broken: the destinations users need most have no tooltips in icon mode. Switcher and New store feel finished; the icon stack feels unfinished.

#### What's Working

1. Tooltip infrastructure (zero delay, right side, collapsed-only) when `tooltip` is passed.
2. Store switcher collapse is deliberate (hide text/chevron, keep icon, rich aria).
3. New store remains legible as primary CTA with tooltip.
4. Inset shell + cookie + ⌘B are Operate-grade bones.

#### Priority Issues

- **[P0] Nav items have no collapsed tooltips** — NavGroup omits `tooltip={item.title}`. Suggested: `/impeccable polish` or targeted fix on nav-group.
- **[P1] Icon collision: switcher Store vs nav Stores** — Suggested: `/impeccable clarify` / icon differentiation.
- **[P1] Brand collapse sloppy + tooltip "Overview"** — Suggested: `/impeccable polish` brand hide + correct tooltip.
- **[P2] Active store invisible at a glance** — Suggested: `/impeccable colorize` or monogram encoding.
- **[P2] New store louder than store context** — Suggested: `/impeccable quieter` on CTA / stronger switcher.

#### Persona Red Flags

**Alex:** Silent nav icons; Store twin footgun; "why tooltip CTA not Team?"
**Sam:** Nav labels clipped; keyboard gets no hover tooltips; switcher aria is a bright spot.
**Casey:** Icon rail is md+ only (mobile Sheet); collapsed issues N/A on phone.

#### Minor Observations

- Submenus fully hidden in icon mode (latent).
- Content overflow-hidden — no scroll if nav grows.
- Referral Gift metaphor weak.

#### Questions to Consider

1. Is collapsed mode a power feature or a skill tax unpaid by tooltips?
2. Why is New store louder than multi-store context?
3. When two icons say store, which is current client?
4. Is the logo Overview, brand, or home — pick one.
