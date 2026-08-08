---
target: the admin page (agency dashboard)
total_score: 15
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-07-31T10-07-01Z
slug: packages-admin-dashboard
---
# Critique: Agency Admin (packages/admin/dashboard)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Fake Live badges, decorative notification dot, static KPIs |
| 2 | Match System / Real World | 2 | Agency language OK; Help/System status are dead ends |
| 3 | User Control and Freedom | 2 | Nav works; hard redirects to merchant via window.location |
| 4 | Consistency and Standards | 1 | Efferd shell + Medusa tokens + mock SaaS patterns clash |
| 5 | Error Prevention | 1 | Manage jumps hosts with no confirm; no empty-state actions |
| 6 | Recognition Rather Than Recall | 2 | Labels present; notification/search duplicated without outcomes |
| 7 | Flexibility and Efficiency | 2 | ⌘K palette exists; no bulk store actions |
| 8 | Aesthetic and Minimalist Design | 2 | Clean chrome; placeholder stores, promo card, duplicate CTAs |
| 9 | Error Recovery | 1 | No real errors/empty recovery paths for live data |
| 10 | Help and Documentation | 1 | Help Center routes to dashboard; no real help |
| **Total** | | **15/40** | **Poor** |

## Design Specificity Verdict

**LLM:** Category-interchangeable multi-tenant SaaS admin. BentoCo Agency branding is surface-level (logo text, store subdomains). Structure is Efferd app-shell-3 + generic KPI cards + mock Store Brand N list—not authored for multi-store agency ops workflows (ownership transfer, GMV rollups, suspension workflows).

**Detector:** 4× overused-font (Inter/Roboto) in index.css—platform default for Medusa admin; treat as low-priority false signal for product uniqueness, valid as "not distinctive."

**Visual overlays:** Browser injection not available this run.

## Overall Impression

Shell architecture is approaching Efferd (flush sidebar + inset main). Product truth is still a prototype: mock KPIs, fake store list, non-functional notifications, help links that loop home. Biggest opportunity: replace mock data theater with real agency jobs-to-be-done and honest empty states.

## What's Working

1. **Clear primary IA** — Overview / Stores / Team / Billing is scannable (≤4 top nav).
2. **Inset main panel pattern** — Correct separation: sidebar flush, main rounded inset.
3. **Theme + store switcher** — Dark mode control and multi-store switcher are the right agency affordances.

## Priority Issues

### [P0] Mock data presented as live truth
- **What:** Hardcoded KPIs (142 stores, $2.4M GMV), Store Brand 1–4, Live badges always green.
- **Why:** Operators cannot trust the dashboard; decisions on fake metrics are dangerous.
- **Fix:** Wire real APIs or show explicit "Demo data" / empty states with next actions.
- **Suggested command:** `/impeccable harden packages/admin/dashboard`

### [P1] Shell still feels like template chrome, not agency product
- **What:** LatestChange promo, Help Center → /agency/dashboard, System status → dashboard, icon-only Search/Notifications that do little.
- **Why:** Trust and orientation break; first-timers hit dead ends.
- **Fix:** Remove or wire promo; real help URL; notifications panel or remove badge; dedupe search entry points.
- **Suggested command:** `/impeccable distill packages/admin/dashboard`

### [P1] Store "Manage" hard-navigates away without context
- **What:** `window.location.href = http://store-N.localhost:7001` from list and switcher.
- **Why:** Context loss, no return path, localhost-only, breaks production mental model.
- **Fix:** Router-aware open in new tab, preserve agency return, confirm domain mapping.
- **Suggested command:** `/impeccable clarify packages/admin/dashboard`

### [P1] Visual hierarchy competition in header
- **What:** Store switcher + breadcrumb + search + notifications + theme + avatar; also New Store in sidebar and page header.
- **Why:** >4 concurrent decision points; primary task unclear.
- **Fix:** One primary "New Store"; demote secondary tools; breadcrumb vs switcher role clarity.
- **Suggested command:** `/impeccable layout packages/admin/dashboard`

### [P2] Accessibility gaps
- **What:** Decorative notification dot without accessible status text; color-only trend arrows; scrollbars globally hidden.
- **Why:** Screen reader and keyboard users lose status and scroll affordance.
- **Fix:** `aria-live`/labels; not color-alone for trends; don't hide scrollbars system-wide without alternatives.
- **Suggested command:** `/impeccable audit packages/admin/dashboard`

## Persona Red Flags

**Alex (Power User):** Command palette exists but limited. No bulk store ops. Manage is one-at-a-time hard redirect. Download Report is dead button.

**Sam (A11y):** Notification button has aria-label but red dot is pure decoration. Global scrollbar hide hurts discovery. Focus management on shell OK-ish; live regions missing for status.

**Priya (Agency Ops Manager):** Needs real GMV/suspension/ownership signals—gets Store Brand N. Store switcher lists demo stores only. Suspended tab is empty with no path to fix.

## Minor Observations

- Duplicate "New Store" (sidebar CTA + page header).
- Footer Help/System status both point at dashboard.
- Staging/Suspended empty states have no CTA.
- Breadcrumb only shows single active page segment.
- Hidden scrollbars app-wide is aggressive for data-heavy admin.

## Questions to Consider

- What is the one agency job Overview must answer in 5 seconds?
- Should "enter store" be a first-class flow with return-to-agency, not a hard redirect?
- Is this still a prototype shell, or are we shipping operators tomorrow?
