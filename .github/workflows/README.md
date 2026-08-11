# GitHub Actions

**Status:** Disabled for Bentoco product use.

This monorepo was derived from Medusa and previously shipped dozens of upstream workflows
(release, docs, Linear triage, Algolia, Dependabot automation, etc.). Those jobs fail without
Medusa org secrets and flooded maintainers with email.

- Active workflow: `ci-disabled.yml` (manual notice only)
- Former workflow names: see `_removed-medusa-workflows.list.txt`

## Repo settings (recommended)

1. **Settings → Actions → General → Actions permissions → Disable actions**  
   Stops any remaining runs and email immediately.
2. **Watch → Participating** (or Custom without Actions failures) to mute noise.

## Re-enabling

Add new Bentoco-specific workflows under this folder (test, build, deploy) when ready.
Do not restore Medusa release/Linear/Algolia crons unless you have the matching secrets.
