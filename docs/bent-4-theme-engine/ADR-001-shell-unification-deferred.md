# ADR-001: Dual storefront shell unification deferred (Phase E)

**Status:** Accepted (defer)  
**Date:** 2026-08-09  
**Context:** CONNECT-STOREFRONT-TODO Phase E

## Decision

Phase E (unify tenant `TenantStorefront` with Aura `Header`/`Footer` / shop routes into one chrome) is **explicitly deferred**.

## Rationale

- Phases A–D deliver editor → live homepage: branding, banners, promises, category sections, CSS tokens, cache/font fixes, and tenant-scoped products.
- Full shell unification touches every tenant route, nav IA, and marketing/Aura pages — large risk vs. shipping the theme connection.

## Consequences

- Tenant homepage uses tokenized `TenantStorefront`.
- Apex / some secondary routes may still use Aura chrome until a future ADR implements E1-A or E1-B.

## Follow-up

Revisit when product prioritizes one continuous merchant UX across homepage + shop.
