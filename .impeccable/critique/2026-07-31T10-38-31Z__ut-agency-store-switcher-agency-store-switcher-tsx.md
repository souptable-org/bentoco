---
target: managed store dropdown (AgencyStoreSwitcher)
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-07-31T10-38-31Z
slug: ut-agency-store-switcher-agency-store-switcher-tsx
---
# Critique: Managed store dropdown (AgencyStoreSwitcher)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Selected store shown; no loading/empty/error states for real lists |
| 2 | Match System / Real World | 2 | "Select store" then opens merchant admin — action model is jump, not select-in-place |
| 3 | User Control and Freedom | 3 | New tab preserves agency return; Agency overview stays in-tab |
| 4 | Consistency and Standards | 2 | Dual mental models: "selected" check vs every row opens external admin |
| 5 | Error Prevention | 1 | No confirm; suspended stores open same as active; popup may be blocked |
| 6 | Recognition Rather Than Recall | 3 | Labels, status, new-tab hints visible; collapsed sidebar relies on tooltip |
| 7 | Flexibility and Efficiency | 2 | No search/filter; scales poorly past ~10 stores; no keyboard typeahead |
| 8 | Aesthetic and Minimalist Design | 2 | Dense helper copy + "New tab" on every row + Demo badge is noisy |
| 9 | Error Recovery | 1 | No feedback if window.open blocked; no toast on failure |
| 10 | Help and Documentation | 3 | Inline new-tab explanation before selection |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict

**LLM:** Placement in the sidebar under the agency brand is product-correct for multi-store ops. Interaction still reads as a generic "org switcher" that *navigates away* rather than *selects context* within agency. Demo fixtures and "Demo store selection" badge are honest but not agency-ops specific (no ownership transfer, no suspended guard, no "manage in agency" vs "open merchant").

**Detector:** Clean (0 findings) on switcher + store URL helpers.

**Visual overlays:** Not run (no browser injection this session).

## Overall Impression

Solid primitive: sidebar home, new-tab disclosure, collapsed icon mode. Biggest UX debt is **confused purpose**: the control looks like a context switcher (checkmarks, "selected") but acts like a launcher (every item opens merchant admin). Fix the model, then scale/search and empty states.

## What's Working

1. **Sidebar placement** — Store context lives next to agency identity, not competing in the header.
2. **New-tab disclosure** — Menu copy + per-row "New tab" + aria-labels address WCAG G201 better than a silent `window.open`.
3. **Collapsed mode** — Icon + tooltip keeps the control available when the sidebar is icon-only.

## Priority Issues

### [P1] Dual purpose: "selected store" vs "open merchant"
- **What:** Checkmark + "Selected store" language implies in-app context; default handler always `openMerchantStore` (external).
- **Why:** Users expect selection to filter agency views or set working store; instead they leave the app.
- **Fix:** Split actions: primary = set agency context (`onSelectStore`); secondary = "Open merchant (new tab)". Or rename UI to "Open store admin" and drop selection semantics.
- **Suggested command:** `/impeccable clarify` or `/impeccable shape` for the interaction model

### [P1] No scale path (search / long list)
- **What:** Flat map of all stores; fixed 280px menu; no filter, groups, or virtualization.
- **Why:** Agencies with 50–200 stores cannot use this efficiently.
- **Fix:** Search field at top of menu; group by status; "View all stores" → `/agency/stores`.
- **Suggested command:** `/impeccable layout` / harden for data density

### [P1] Suspended (and staging) open without guard
- **What:** Aura Beauty `suspended` still opens merchant admin like an active store.
- **Why:** Risk of operating the wrong environment; no confirmation.
- **Fix:** Disable open for suspended, or require confirm; badge status more prominently; optional "View only in agency".
- **Suggested command:** `/impeccable harden`

### [P2] Silent failure if popup blocked
- **What:** `window.open` with no null check / toast.
- **Why:** Click appears to do nothing.
- **Fix:** If `open` returns null, toast with link to copy/open manually.
- **Suggested command:** `/impeccable harden`

### [P2] Visual noise in menu
- **What:** Helper paragraph + "New tab" uppercase on every row + external icon + Demo badge under trigger.
- **Why:** Cognitive load for a frequent control; end of list feels heavy.
- **Fix:** One-line menu subtitle; icon-only external with title; keep full aria-label.
- **Suggested command:** `/impeccable quieter` or distill

### [P3] "Agency overview" at bottom of store launcher
- **What:** Navigation item mixed into store list.
- **Why:** Slight IA confusion; logo already goes home.
- **Fix:** Remove or move to brand row only.
- **Suggested command:** `/impeccable distill`

## Persona Red Flags

**Alex (Power User):** No type-to-search; no recent stores; must mouse through full list every time.

**Jordan (First-Timer):** Checkmark suggests "I'm selecting context" then a new tab appears — disorienting even with copy.

**Priya (Agency Ops):** Needs to avoid opening suspended stores by accident; status is low-contrast monospace, not a hard stop.

## Cognitive Load

- Single focus: Fail (select vs open)
- Chunking: Fail if store count grows (4 demo OK)
- Minimal choices: Borderline (4 stores + overview)
- Progressive disclosure: Fail (no search)

## Minor Observations

- Status is plain text in mono line; could use status badge tokens (`agency-status-styles`).
- Header variant still exists but unused — dead path risk.
- `useSidebar()` couples component to provider (fine today, fragile if reused).

## Questions to Consider

- Is this control a **context switcher** or a **merchant launcher**? It cannot be both without two explicit actions.
- Should agency pages filter by selected store before any merchant open?
- What is the empty state when the agency has zero stores?
