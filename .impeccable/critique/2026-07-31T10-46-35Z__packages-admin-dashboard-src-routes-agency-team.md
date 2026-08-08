---
target: Team Members
total_score: 10
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-07-31T10-46-35Z
slug: packages-admin-dashboard-src-routes-agency-team
---
Method: dual-agent (A: 019fb7c6-c389-79a2-8591-bbe9bf3dd43c · B: 019fb7c6-c3a3-7e10-b858-d8ffb0c026b1)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Loading only changes subtitle; no table skeleton; actions give zero feedback |
| 2 | Match System / Real World | 1 | Roles render as `AGENCY OWNER` / `AGENCY MEMBER`; ShieldAlert on ordinary members |
| 3 | User Control and Freedom | 1 | Remove has no cancel/confirm; Search / Filter / Invite / menus are dead ends |
| 4 | Consistency and Standards | 1 | Diverges from Client Stores (no working filters, no sr-only action labels) |
| 5 | Error Prevention | 0 | Destructive Remove same depth as View/Edit; no owner guard; no confirm |
| 6 | Recognition Rather Than Recall | 2 | Name+email+avatar scannable; store assignment as counts forces recall of which stores |
| 7 | Flexibility and Efficiency | 1 | Search/Filter unwired; no sort, bulk, resend invite, or keyboard power path |
| 8 | Aesthetic and Minimalist Design | 2 | Clean single-card layout; dead Filter Roles + non-functional search are chrome noise |
| 9 | Error Recovery | 0 | No isError UI; query failure silently falls through to demo members |
| 10 | Help and Documentation | 1 | Subtitle only; no role glossary or access-model help |
| **Total** | | **10/40** | **Critical** |

#### Design Specificity Verdict

**LLM assessment**: Generic SaaS team roster with Bentoco labels glued on — not a multi-store agency access surface. Missing: which client stores a member can open, real invite workflow, store-scoped Edit Access, owner guards on Remove. Sibling Client Stores has working table engine; Team is a thinner non-functional echo. Status tokens via `agencyMemberStatusBadgeClass` are the only product-token touch. **Fail design-specificity for agency Operate.**

**Deterministic scan**: `detect.mjs --json` on `packages/admin/dashboard/src/routes/agency/team` and the full tsx path returned `[]` (exit 0). Zero rule hits. Detector is healthy (synthetic side-tab control produced findings). Clean scan reflects absence of saturated marketing anti-patterns, not functional readiness.

**Visual overlays**: No reliable user-visible overlay. Browser visualization skipped — no browser automation exposed in Assessment B session. Coverage is static source scan only.

#### Overall Impression

The page looks like a finished team directory but behaves like a static mock. Scannable rows and clean layout hide a broken Operate contract: invite does nothing, filters do nothing, store assignment is opaque counts, and Remove is one click with no guardrails. Biggest opportunity: make this a real **access control** surface (who can touch which client stores) instead of a people table with dead chrome.

#### What's Working

1. **Scannable member primary cell** — avatar initials + name + email is a solid Operate roster pattern.
2. **Status tokens via product system** — Active → green tag, Invited → orange/pending via `agencyMemberStatusBadgeClass`.
3. **Page shell hierarchy** — clear h1, muted purpose line, primary CTA top-right; structure is fine; behavior and domain model are not.

#### Priority Issues

- **[P0] Silent demo fallback masquerades as live team**
  - **Why it matters**: Empty/error API still shows Alice/Bob/Charlie Pixelcraft staff; users trust false roster for access decisions.
  - **Fix**: Gate fixtures behind explicit demo mode; show empty/error/loading table states when live.
  - **Suggested command**: `/impeccable harden packages/admin/dashboard/src/routes/agency/team`

- **[P0] Destructive Remove with zero prevention**
  - **Why it matters**: Same click-depth as View/Edit; no confirm, no owner block, no store-impact copy — high blast radius for agency admin.
  - **Fix**: Confirm dialog with consequence copy; disable/remove for last owner; distinguish revoke invite vs remove member.
  - **Suggested command**: `/impeccable harden packages/admin/dashboard/src/routes/agency/team`

- **[P1] Primary actions are non-functional**
  - **Why it matters**: Invite, Search, Filter Roles, and all menu items invite action then do nothing — trains distrust of the whole nav section.
  - **Fix**: Wire invite flow (or disable CTA with honest copy); bind search; real role filter or remove the control; implement or hide menu items.
  - **Suggested command**: `/impeccable shape packages/admin/dashboard/src/routes/agency/team` then implement

- **[P1] Multi-store assignment is non-actionable**
  - **Why it matters**: Assigned Stores is the only multi-store signal and is a dead string (`"2 Stores"`) — the product's actual access object is invisible.
  - **Fix**: Show store names/status; open Edit Access with store picker; link to client stores where relevant.
  - **Suggested command**: `/impeccable shape packages/admin/dashboard/src/routes/agency/team`

- **[P2] Role UX is enum dump + misleading icons**
  - **Why it matters**: `AGENCY_OWNER` → "AGENCY OWNER"; ShieldAlert on members reads as hazard, not staff.
  - **Fix**: Human labels (Owner / Member); replace ShieldAlert with neutral role icon; optional short role description.
  - **Suggested command**: `/impeccable clarify packages/admin/dashboard/src/routes/agency/team`

#### Persona Red Flags

**Alex (Power User)**: Dead Search and Filter Roles; no sort/bulk; Edit Access appears but no-ops; Client Stores works while Team does not — distrust of section.

**Sam (Accessibility)**: Icon-only MoreHorizontal with no sr-only name (Stores has "Open menu"); search lacks label beyond placeholder; role partly color-coded; no Remove dialog focus path because no dialog.

**Jordan (First-Timer)**: AGENCY_* jargon; ShieldAlert implies problem users; Invite/Filter teach buttons don't work; View Profile / Edit Access / Remove with no consequence preview.

#### Minor Observations

- Only first underscore replaced in role strings.
- No Invited-specific actions (Resend / Cancel invite).
- Command palette "Invite Team Member" only navigates here — double false affordance.
- Fixed `w-72` search; no row count/pagination at scale.
- Actions trigger missing `agency-touch-target` vs sibling Stores.
- Subtitle overclaims "live" while fixtures may still render.

#### Questions to Consider

1. If Assigned Stores is the only multi-store signal, why is it a dead string instead of the real access object?
2. Would you ship Remove on a live agency owner row with this menu as-is?
3. Why does Client Stores get a real table engine while Team (higher blast radius) gets a mock?
4. Is ShieldAlert intentional for "member," or a security-warning copy-paste?
5. When invite lives in the command palette and as the only primary CTA, where does the user finish the invite?
6. If the API returns `[]`, is showing Alice/Bob/Charlie a feature or a production incident?
