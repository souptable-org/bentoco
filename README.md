# Bentoco

**Multi-tenant commerce for agencies and merchants** — API, admin, themed storefront, and marketing site.

Bentoco is built on a Medusa-based monorepo, customized for **tenant isolation**, **agency tooling**, **Razorpay**, and a **theme engine** that drives live storefront branding.

---

## What’s in this repo

| Area | Path | Port (local) |
|------|------|----------------|
| Commerce API | `packages/bentoco`, CLI | **9000** |
| Merchant / agency admin | `packages/admin/dashboard` | **7001** |
| Tenant storefront | `apps/storefront` | **3001** |
| Marketing site | `apps/marketing` | (Next app) |
| Theme engine | `packages/theme-engine`, `packages/bentoco/src/utils/theme-engine` | — |
| Theme docs | `docs/bent-4-theme-engine/` | — |

---

## Quick start (local)

### Prerequisites

- Node.js 20+
- Yarn 3.x (repo uses Yarn workspaces)
- PostgreSQL (`DATABASE_URL`)

### 1. Install

```bash
yarn install
```

### 2. Environment

Set at least:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bentoco
JWT_SECRET=supersecret_bentoco_jwt
COOKIE_SECRET=supersecret_bentoco_cookie
BENTOCO_DEFAULT_TENANT_ID=<your-dev-tenant-uuid>
```

Storefront (`apps/storefront/.env.local`):

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

Admin preview iframe (optional, defaults to storefront on 3001):

```env
VITE_MEDUSA_STOREFRONT_URL=http://localhost:3001
```

### 3. Run the stack

```bash
# API
node packages/cli/bentoco-cli/cli.js start --types false -p 9000

# Admin
cd packages/admin/dashboard && yarn dev --host 0.0.0.0 --port 7001

# Storefront
cd apps/storefront && npm run dev
```

| App | URL |
|-----|-----|
| Admin | http://localhost:7001 |
| Store theme hub | http://localhost:7001/store |
| Theme editor | http://localhost:7001/store/editor |
| Storefront | http://localhost:3001 |

---

## Theme engine (merchants)

- Configure branding, colors (light/dark), fonts, radius, banners, promises, homepage categories in **Config Editor**.
- **Save draft** → preview only (`?preview=1`); **Publish** → live customer site.
- Guide: [`docs/bent-4-theme-engine/MERCHANT-THEME.md`](docs/bent-4-theme-engine/MERCHANT-THEME.md)
- Open backlog: [`docs/bent-4-theme-engine/OPEN-ISSUES.md`](docs/bent-4-theme-engine/OPEN-ISSUES.md)

---

## Monorepo notes

- Package manager: **Yarn 3** workspaces (root `package.json`).
- Core commerce packages live under `packages/` (Medusa-derived modules, renamed for Bentoco where applicable).
- **GitHub Actions:** inherited Medusa CI is **disabled** (see [`.github/workflows/README.md`](.github/workflows/README.md)) to avoid failed scheduled jobs and email spam. Re-enable when you add Bentoco-specific CI.

---

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/bent-4-theme-engine/`](docs/bent-4-theme-engine/) | Theme phases, gap-fill, merchant guide |
| [`apps/storefront/README.bentoco.md`](apps/storefront/README.bentoco.md) | Storefront run notes |
| [`CLAUDE.md`](CLAUDE.md) / `Claude.md` | Agent / contributor architecture notes |

---

## License

See [LICENSE](LICENSE). Upstream Medusa heritage is MIT; Bentoco product customizations live in this repository under `souptable-org/bentoco`.
