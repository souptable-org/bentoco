# Stage 5 — Agency UI + login bridge (completed)

**Date:** 2026-08-04  
**Plan:** `thoughts/shared/plans/2026-08-04-bentoco-medusa-agency-db-migration.md`

## Goal

Use **existing** agency UI + login screens, but drive them with **real Medusa auth** and **live `/api/agency/*` data** (Stage 4).

## What already existed

- Routes: `/agency/*`, `/agency/login`, main `/login`
- Shell: `AgencyLayout`, dashboard/stores/team/billing/audit views
- RTK Query client pointing at `http://localhost:9000/api/agency/*`

## What Stage 5 changed

### Backend

| Endpoint | Purpose |
|----------|---------|
| `GET /api/agency/me?email=` | Resolve agency membership for a Medusa user |
| `POST /api/auth/verify-temporary-access` | OTP-style membership check (dev-friendly) |

### Frontend

| File | Change |
|------|--------|
| `lib/agency-session.ts` | Mode / agency UID / membership persistence |
| `routes/login/login.tsx` | Real `signIn` + `fetchAgencyMe` routing (no fake email JWT) |
| `routes/agency/login/*` | Email+password primary; OTP secondary |
| `agency-layout.tsx` | Gate on membership, not missing `user.role` field |
| `protected-route.tsx` | Agency members → `/agency/dashboard` |
| `redux/api.ts` | Agency UID query params; optional tenantId on access-log |
| stores / team / audit views | Prefer live API data |
| `nav-user.tsx` | Live user + working logout |

## How to log in (local)

| User | Password | Lands on |
|------|----------|----------|
| `agcy@bentoco.com` | `supersecret` | Agency dashboard |
| `admin@bentoco.com` | `supersecret` | Agency dashboard *(also seeded as AGENCY_OWNER in Stage 3)* |

Pure merchant-only users (no `agency_team_member` row) go to `/orders`.

## Smoke tests (API)

| Call | Result |
|------|--------|
| `GET /api/agency/me?email=agcy@…` | `isAgency: true` |
| `POST /auth/user/emailpass` | 200 JWT |
| overview / stores / team | 200 live rows |
| verify-temporary-access | 200 |

## Still demo / incomplete

- Billing remains placeholder API
- Referral page not wired to backend
- Agency routes still `AUTHENTICATE = false` on server (UI gates membership client-side)
- OTP path does not create a full Medusa session by itself (password login preferred)

## Next

**Stage 6** — RLS isolation (optional hardening)  
**Stage 7** — cleanup docs, drop temp DBs, retire stub completely
