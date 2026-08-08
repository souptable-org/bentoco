If you’re pulling a hard fork—burning the boats and taking full ownership of the codebase—that changes the entire equation. You’re no longer hacking _around_ someone else’s abstraction layers or worrying about breaking upstream compatibility. You are using their code as raw steel to forge your own engine.

Since you've already turned a single-tenant app into a multi-tenant platform before, you know the exact drill. But when hard-forking a massive e-commerce codebase for the Indian market, here is the surgical execution plan to turn a cloned repo into a lean, multi-tenant **Bharat Engine**.

## 1. Pick the Right Raw Material for the Fork

If you are going to hard-fork a TypeScript/Node codebase, your two best options to clone today are **Medusa 2.0** or **Vendure**.

- **Why Medusa 2.0 is great for a hard fork:** Its core was recently rewritten around **Drizzle ORM** and a modular workflow engine. Drizzle makes injecting multi-tenant filters and `store_id` constraints at the query level far easier than legacy ORMs.
    
- **Why Vendure is great for a hard fork:** Its NestJS architecture is clean, strict, and predictable. Adding tenant middleware across NestJS controllers/resolvers is straightforward.
    

_Recommendation:_ Clone **Medusa 2.0**, strip out what you don't need, and turn it into your own proprietary backend.

## 2. The Multi-Tenancy Architecture (Column-Level RLS)

For thousands of solo operators, spinning up separate databases or separate container instances will eat your server budget alive. You want **Single-Database, High-Density Multi-Tenancy**.

```
[ Incoming Request: merchant-a.yourdomain.com ]
                      │
                      ▼
        [ Next.js Edge Middleware ]
     (Extracts tenant_id from Subdomain / Domain)
                      │
                      ▼
       [ Global ORM / Supabase RLS Layer ]
  (Appends WHERE tenant_id = 'merchant-a' to ALL queries)
```

### Execution Steps:

1. **The Core Migration:** Add `tenant_id` (UUID, indexed) to every single database table (`products`, `orders`, `customers`, `carts`, `settings`).
    
2. **Database-Level Protection (PostgreSQL RLS):** Enable Row Level Security on Supabase/Postgres. Even if a developer writes a bug in an API route, the database itself refuses to return records that don't match the current request’s `tenant_id`.
    
3. **ORM Middleware Enforcement:** Intercept all database reads/writes at the ORM layer (Drizzle/Prisma/TypeORM) so `tenant_id` is automatically injected into every query context.
    

## 3. Gut the Western Bloat (Day One Cleanup)

The biggest advantage of a hard fork is deleting code you don't need. Immediately strip out:

- **US/EU Tax Engines:** Delete Avalara, TaxJar, and complex VAT calculation modules. Replace with a single, flat GST calculator field.
    
- **Multi-Currency Math:** Unless you are doing cross-border D2C, force the core math engine to calculate natively in **INR (Paisa)** as integers to avoid floating-point errors.
    
- **Western Carrier Integrations:** Nuke FedEx/UPS/DHL defaults. Replace the shipping module with a direct native driver for **Shiprocket / Delhivery API**.
    
- **Stripe-First Checkout:** Delete the assumption that an order requires a credit card token before creation.
    

## 4. Re-engineer the Order State Machine

This is where you make the codebase uniquely yours. Standard e-commerce engines use this rigid flow:

`Cart ➔ Checkout ➔ Payment Gateway ➔ Order Placed`

You will rewrite the state machine in your fork to support the **Indian COD / Pre-Paid Flip Pipeline**:

```
[ Cart Submitted ]
       │
       ▼
[ ORDER_INITIATED ] ──(Trigger Evolution API)──► [ WHATSAPP_VERIFYING ]
                                                        │
                      ┌─────────────────────────────────┴─────────────────────────────────┐
                      ▼                                                                   ▼
           (Customer Chooses UPI)                                             (Customer Confirms COD)
                      │                                                                   │
                      ▼                                                                   ▼
             [ PREPAID_FLIPPED ]                                                  [ COD_VERIFIED ]
                      │                                                                   │
                      └─────────────────────────────────┬─────────────────────────────────┘
                                                        ▼
                                               [ AWB_GENERATED ]
```

By embedding this state machine directly into the core `Order` service of your fork, your WhatsApp automations aren't an external web-hook hack—they are the native heartbeat of the database.

## 5. Domain & Edge Routing Layer

Use **Next.js Edge Middleware** at the entry point of your platform:

- When a request hits `storename.bharatengine.com` or `customdomain.com`, the middleware looks up the hostname in a Redis edge cache (Upstash), resolves it to a `tenant_id`, and passes it in the request header (`x-tenant-id`) to your backend.
    
- The merchant admin dashboard lives at `app.bharatengine.com`, where authentication sets a JWT containing their specific `tenant_id`.
    

## Summary

If you have the dev capability to hard-fork, you win three massive advantages:

1. **Zero License/Framework Constraints:** You own the code forever.
    
2. **Zero Overhead:** You delete 60% of the bloat built for Western enterprise stores.
    
3. **Hyper-Specific Engine:** You hardcode India's WhatsApp, UPI, and RTO prevention logic directly into the core database schema.

This is exactly where the real engineering begins. By deciding to hard-fork Medusa 2.0, you are bypassing the multi-tenant SaaS limitations that developers complain about in the Medusa GitHub repositories. Medusa 2.0 is modular and fast, but it natively assumes one database = one merchant.

To turn it into the **Bharat Commerce Engine** where thousands of merchants safely share a single database, we have to inject a native Multi-Tenancy Layer directly into PostgreSQL.

Here is the exact architectural playbook and SQL foundation to "Frankenstein" Medusa 2.0 into a true SaaS platform.

### Step 1: The Core Schema Migration (The `tenant_id` Injection)

We must modify Medusa’s core tables to include a `tenant_id`. You don't just add this to products and orders; for a true SaaS, you have to add it to API keys, sales channels, and users.

You will run a master SQL migration on top of the Medusa schema:

SQL

```
-- 1. Create the Tenant (Merchant) Table
CREATE TABLE tenant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inject tenant_id into Medusa's Core Tables
ALTER TABLE "product" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;
ALTER TABLE "order" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;
ALTER TABLE "customer" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;
ALTER TABLE "cart" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;
ALTER TABLE "user" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;

-- 3. Create Indexes for Speed (Because all queries will now filter by tenant)
CREATE INDEX idx_product_tenant ON "product"(tenant_id);
CREATE INDEX idx_order_tenant ON "order"(tenant_id);
```

### Step 2: The "God Mode" Security (PostgreSQL RLS)

If you rely on your backend Node.js code to manually append `.where({ tenant_id: id })` to every single database call, a developer _will_ eventually forget, causing Store A to accidentally see Store B's orders.

We prevent this by turning on **Row Level Security (RLS)** in PostgreSQL. The database itself will physically refuse to serve cross-tenant data.

SQL

```
-- 1. Enable RLS on core tables
ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customer" ENABLE ROW LEVEL SECURITY;

-- 2. Create the Isolation Policies
CREATE POLICY product_tenant_isolation ON "product"
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY order_tenant_isolation ON "order"
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### Step 3: The Edge Middleware (Context Switching)

Now that the database is locked down, your backend must tell PostgreSQL _which_ tenant is making the request before executing any queries.

In your Medusa API wrapper or middleware, you extract the subdomain (e.g., `brand-x.bharatengine.com`), resolve it to a `tenant_id`, and set the Postgres local variable for that specific transaction lifecycle.

TypeScript

```
// Express / Next.js Middleware before hitting Medusa Services
export async function tenantMiddleware(req, res, next) {
    const subdomain = req.headers.host.split('.')[0];
    
    // 1. Resolve subdomain to tenant_id (Cached in Redis)
    const tenantId = await getTenantIdFromRedis(subdomain);
    
    // 2. Open DB transaction and set the RLS context
    await db.transaction(async (trx) => {
        await trx.raw(`SET LOCAL app.current_tenant = '${tenantId}'`);
        
        // 3. Attach transaction to request so Medusa uses it
        req.transaction = trx; 
        next();
    });
}
```

### Step 4: The "Bring Your Own Gateway" Table (Crucial for SaaS)

Medusa natively expects one Stripe or Razorpay API key inside the `.env` file. That works for a single brand, but you have 1,000 solo operators who need to plug in their _own_ Razorpay API keys to bypass Shopify's transaction fees.

We must build a custom credentials table that Medusa's Payment Provider module fetches dynamically:

SQL

```
CREATE TABLE tenant_payment_config (
    id UUID KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL, -- e.g., 'razorpay', 'phonepe'
    encrypted_payload JSONB NOT NULL, -- Holds their specific API Keys
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, provider_id)
);
```

You will rewrite Medusa's `PaymentService` to bypass the `.env` file, read from this table based on the `app.current_tenant` context, and initialize the Razorpay SDK on the fly.

### The Result

You have successfully weaponized Medusa. You kept their boring e-commerce logic (cart math, variants, discounts), but you now own a **true Multi-Tenant SaaS Engine**.