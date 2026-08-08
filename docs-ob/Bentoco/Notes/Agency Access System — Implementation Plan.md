

> **Core Principle:** The agency never owns a store. The merchant owns the store and grants the agency access via email consent.

---

## Mental Model

- Merchant Admin Panel is the **core product** — exists independently
- Store is **always owned by the merchant**, not the agency
- "Agency access" = merchant trusts agency the same way you add a team member
- Agency RBAC controls which agency staff can work on which merchant store
- Agency Dashboard = **launcher + billing hub only**

---

## Auth Flow (Behind the Scenes)

```
Agency enters merchant email
        ↓
System sends consent email to merchant
        ↓
Merchant clicks Confirm
        ↓
Backend silently generates a system password
  — merchant never sees it
  — agency never sees it
  — stored only in DB (hashed)
        ↓
System stores:
  { email, hashed_password, agency_uid: "AGENCY-849201" }
        ↓
Agency staff opens that store via switcher
  → System checks Agency UID → finds store
  → Checks that staff member's RBAC inside agency
  → Grants or denies access
        ↓
Agency staff logs in on their OWN agency credentials
  (never on merchant's credentials)
        ↓
Agency module logs every session: who, when, what store
```

---

## Exception: Merchant Has No Existing Store

The flow branches at email confirmation:

```
Agency sends invite to merchant@email.com
        ↓
System checks: does this email have an existing store?
        ↓
        ├── YES (existing merchant)
        │     → Merchant confirms → agency gets access
        │
        └── NO (brand new merchant)
              → Agency fills in store details on merchant's behalf:
                   - Store name
                   - Subdomain
                   - Pick a Plan (see below)
                   - Merchant email (pre-filled)
              → Store created with merchant as owner
              → Agency access automatically granted
              → Merchant receives email:
                   "Your store is ready. Here is your login."
              → Merchant never had to do setup themselves
```

> **Rule preserved:** Store is still owned by the merchant.
> Agency created it on their behalf but has no ownership claim.

---

## Plan Selection Step (Required)

During new store creation, the agency must pick a plan:

| Plan | Can Go Live? | Notes |
|---|---|---|
| Basic | ✅ Yes | Paid |
| Pro | ✅ Yes | Paid |
| Enterprise | ✅ Yes | Paid |
| **Continue with Free** | ❌ No | Staging / sandbox only — cannot publish to live |

> Free stores are created in a **STAGING** status permanently until upgraded.
> The store switcher shows a `Upgrade to Go Live` badge on free stores.

---

## Phase 1: Database Schema

| Table | Changes |
|---|---|
| `store` | Add `system_password_hash VARCHAR`, `agency_access_uid VARCHAR` (nullable) |
| `agency_store_access` | **New.** `id, store_id, agency_id, status (PENDING/ACTIVE/REVOKED), invited_at, confirmed_at` |
| `agency_store_log` | **New.** `id, store_id, agency_id, member_id, action, timestamp` — audit trail |
| `agency_member` | Ensure `rbac_role` column is present |

---

## Phase 2: Backend API Endpoints

```
POST   /api/agency/invite-store
         Body: { merchantEmail, agencyUid }
         → Sends consent email. Creates agency_store_access (PENDING)

GET    /api/agency/confirm-access?token=xxx
         → Merchant clicks link. Generates system_password_hash.
           Sets agency_store_access → ACTIVE.

DELETE /api/agency/revoke-access
         Body: { storeId, agencyUid }
         → Sets status → REVOKED. Clears system_password_hash.

GET    /api/agency/access-log?storeId=xxx
         → Returns audit log entries.

POST   /api/agency/member-login
         Body: { agencyMemberId, storeId }
         → Checks RBAC → issues scoped session token → logs entry.
```

---

## Phase 3: Email Service

- **File:** `packages/bentoco/src/utils/email.ts`
- Signed token URL (expires 48hrs)
- Template: *"PixelCraft Agency (AGENCY-849201) is requesting access to manage your store. Click to confirm."*
- Stack: Nodemailer or Resend API

---

## Phase 4: Frontend Modal — Agency Dashboard

**2-step modal on "Add Store" button:**

```
Step 1: Merchant Email
  - Input: merchant email
  - Input: store display name (for switcher label)
  - CTA: "Send Access Request"

Step 2: Pending Confirmation
  - "Invite sent to merchant@email.com"
  - Badge: ⏳ Pending Merchant Confirmation
  - Actions: Resend / Cancel
```

Store appears in switcher as **Pending** immediately. Goes **Active** on merchant confirmation.

---

## Phase 5: RBAC Gate on Store Switcher

When agency member clicks a store:
1. `POST /api/agency/member-login`
2. Backend checks member's RBAC role in agency
3. If allowed → scoped session token → redirect to `{store}.localhost:7001`
4. Entry written to `agency_store_log`

---

## Phase 6: Audit Log View

- Per-store log table: who accessed, when, what action
- Accessible via Stores table row → "View Log"

---

## Build Order

```
1 → Schema migration       (Phase 1)
2 → Email utility          (Phase 3)
3 → Backend endpoints      (Phase 2)
4 → Frontend modal         (Phase 4)
5 → RBAC gate on switcher  (Phase 5)
6 → Audit log view         (Phase 6)
```

---

## Out of Scope (v1)

- Merchant self-service portal
- Multi-agency per store (one agency per store for now)
- SSO / OAuth

---

## ⚠️ Technical Requirement: Medusa Auth & RBAC Must Be Extended

The Medusa merchant admin panel ships with its own authentication and RBAC system built for a **single-owner, self-managed store** model.

For Bentoco's agency access system to work, the following must be customised:

### 1. Auth Layer
- Medusa's default login (`/admin/auth`) authenticates against its own `user` table.
- We need to intercept this flow so that when an **agency member** logs in, the system validates against the **`agency_store_access`** table and the member's **agency credentials** — not a stored merchant password.
- The merchant's `system_password_hash` is used as a bridge internally; the agency member never uses it directly.

### 2. RBAC Layer
- Medusa's default RBAC has three roles: `admin`, `member`, `developer`.
- These roles do not map to Bentoco's agency RBAC: `FULL_ACCESS`, `PRODUCTS_ORDERS`, `READ_ONLY`.
- We need to either:
  - **Extend** Medusa's role system to include agency-scoped roles, OR
  - **Override** the permission middleware to check `agency_team_member.rbac_role` when the session originates from an agency login.

### 3. Session Context
- When an agency member is inside a merchant's admin panel, the session must carry:
  - `agencyId` — which agency this member belongs to
  - `rbacRole` — their scoped permission level
  - `tenantId` — which merchant store they are currently operating in
- This context must be passed to every API call so the backend knows to enforce agency RBAC (not merchant owner RBAC).

### Files to modify in Medusa admin
- `packages/admin/dashboard/src/providers/` — extend auth provider
- `packages/admin/dashboard/src/lib/` — add agency session context
- Medusa backend — extend `/admin/auth` route handler
