# Theme engine — open issues (backlog)

**Workspace:** Notion `souptable.home@gmail.com` → **Bento.co → Issues Tracking**  
**Board:** https://app.notion.com/p/3b7456af354e80ed870ae0121007b2be  

## Fixed (do not re-open)

| Issue | Notes |
|-------|--------|
| Admin GET stripped `draft` / history on reload | Fixed: `getOrDefaultTenantTheme` returns stored `theme_config`; CSS from draft when present. Editor `draftFromConfig` prefers `config.draft`. |

## Open (Not started) — future reference

| Issue | Notion |
|-------|--------|
| Install preset still overwrites live config | https://app.notion.com/p/3b9456af354e81e0836cf1027bdefa20 |
| Editor should load form from `config.draft` when present | https://app.notion.com/p/3b9456af354e813092f8db4014d90fa8 *(verify after reload fix; close if redundant)* |
| Pass real branding into TenantChrome on shop/PDP/cart/etc | https://app.notion.com/p/3b9456af354e81f3b715d60160cbc1e9 |
| TenantChrome on remaining content routes | https://app.notion.com/p/3b9456af354e81b7b634fa1207576f6d |
| Smoke test must prove draft ≠ live → publish | https://app.notion.com/p/3b9456af354e819e84ecff028f98b39a |
| Admin always bind tenant from session (not env default) | https://app.notion.com/p/3b9456af354e812fab5ac1ff48997fc7 |
| Dual theme-engine package trees can drift | https://app.notion.com/p/3b9456af354e81f79c1ad1013bf11d46 |

## Related docs

- `GAP-FILL-PLAN.md` — original gap plan  
- `PATH-TO-100-PERCENT.md` — delivery brief  
- `MERCHANT-THEME.md` — merchant save/publish guide  
- `GAP-FILL-PLAN-SUMMARY.txt` (repo root) — status snapshot  
