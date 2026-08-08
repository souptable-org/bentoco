# Bentoco storefront (Aura template)

Imported from `apps/storefront-import/aura-premium-ecommerce.zip`.

## Run

```bash
# Terminal 1 — API
# (from monorepo root, port 9000)

# Terminal 2 — this app
cd apps/storefront
npm install
npm run dev
```

Open **http://localhost:3000**

- Shop: http://localhost:3000/shop  
- Admin (catalog): http://localhost:7001/products  

## Env

See `.env.local`:

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_…`

## Data

- **Live:** Medusa Store API `/store/products`  
- **Fallback:** mock products in `lib/data.ts` if API is down  

Shop page shows source: `Medusa / Bentoco API` or `Demo mock data`.
