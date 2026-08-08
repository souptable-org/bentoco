# Contributing

Thank you for considering contributing to Medusa! This document will outline how to submit changes to this repository and which conventions to follow. If you are ever in doubt about anything we encourage you to reach out either by submitting an issue here or reaching out [via Discord](https://discord.gg/xpCwq3Kfn8).

If you're contributing to our documentation, make sure to also check out the [contribution guidelines on our documentation website](https://docs.medusajs.com/resources/contribution-guidelines/docs).

### Important

Our core maintainers prioritize pull requests (PRs) from within our organization. External contributions are regularly triaged, but not at any fixed cadence. It varies depending on how busy the maintainers are. This is applicable to all types of PRs, so we kindly ask for your patience.

If you, as a community contributor, wish to work on more extensive features, please reach out to CODEOWNERS instead of directly submitting a PR with all the changes. This approach saves us both time, especially if the PR is not accepted (which will be the case if it does not align with our roadmap), and helps us effectively review and evaluate your contribution if it is accepted.

## Prerequisites

- **You're familiar with GitHub Issues and Pull Requests**
- **You've read the [docs](https://docs.medusajs.com).**
- **You've setup a test project with `npx create-medusa-app@latest`**

## Issues before PRs

1. Before you start working on a change please make sure that there is an issue for what you will be working on. You can either find and [existing issue](https://github.com/medusajs/medusa/issues) or [open a new issue](https://github.com/medusajs/medusa/issues/new) if none exists. Doing this makes sure that others can contribute with thoughts or suggest alternatives, ultimately making sure that we only add changes that make

2. When you are ready to start working on a change you should first [fork the Medusa repo](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) and [branch out](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-and-deleting-branches-within-your-repository) from the `develop` branch.
3. Make your changes.
4. [Open a pull request towards the develop branch in the Medusa repo](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork). Within a couple of days a Medusa team member will review, comment and eventually approve your PR.

## Local development

> Prerequisites:
>
> 1. [Forked Medusa repository cloned locally](https://github.com/medusajs/medusa).
> 2. [A local Medusa application for testing](https://docs.medusajs.com/learn/installation).

The code snippets in this section assume that your forked Medusa project and the test project are sibling directories, and you optionally setup the starter storefront as part of the installation. For example:

```
|
|__ medusa  // forked repository
|
|__ test-project // medusa application for testing
|
|__ test-project_storefront // (optional) storefront to interact with medusa application
```

1. Replace the @bentoco/\* dependencies and devDependencies in you test project's `package.json` to point to the corresponding local packages in your forked Medusa repository. You will also need to add the medusa packages in the resolutions section of the `package.json`, so that every dependency is resolved locally. For example, assuming your forked Medusa project and the test project are sibling directories:

```json
// test project package.json (for npm/yarn)
"dependencies": {
    // more deps
    "@bentoco/admin-sdk": "file:../medusa/packages/admin/admin-sdk",
    "@bentoco/cli": "file:../medusa/packages/cli/medusa-cli",
    "@bentoco/framework": "file:../medusa/packages/core/framework",
    "@bentoco/medusa": "file:../medusa/packages/medusa",
},
"devDependencies": {
    // more dev deps
    "@bentoco/test-utils": "file:../medusa/packages/medusa-test-utils",
},
"resolutions": {
    // more resolutions
    "@bentoco/test-utils": "file:../medusa/packages/medusa-test-utils",
    "@bentoco/api-key": "file:../medusa/packages/modules/api-key",
    "@bentoco/auth": "file:../medusa/packages/modules/auth",
    "@bentoco/cache-inmemory": "file:../medusa/packages/modules/cache-inmemory",
    "@bentoco/cache-redis": "file:../medusa/packages/modules/cache-redis",
    "@bentoco/cart": "file:../medusa/packages/modules/cart",
    "@bentoco/locking": "file:../medusa/packages/modules/locking",
    "@bentoco/currency": "file:../medusa/packages/modules/currency",
    "@bentoco/customer": "file:../medusa/packages/modules/customer",
    "@bentoco/event-bus-local": "file:../medusa/packages/modules/event-bus-local",
    "@bentoco/file": "file:../medusa/packages/modules/file",
    "@bentoco/file-local": "file:../medusa/packages/modules/providers/file-local",
    "@bentoco/fulfillment": "file:../medusa/packages/modules/fulfillment",
    "@bentoco/fulfillment-manual": "file:../medusa/packages/modules/providers/fulfillment-manual",
    "@bentoco/index": "file:../medusa/packages/modules/index",
    "@bentoco/inventory": "file:../medusa/packages/modules/inventory",
    "@bentoco/medusa": "file:../medusa/packages/medusa",
    "@bentoco/notification": "file:../medusa/packages/modules/notification",
    "@bentoco/notification-local": "file:../medusa/packages/modules/providers/notification-local",
    "@bentoco/order": "file:../medusa/packages/modules/order",
    "@bentoco/payment": "file:../medusa/packages/modules/payment",
    "@bentoco/pricing": "file:../medusa/packages/modules/pricing",
    "@bentoco/product": "file:../medusa/packages/modules/product",
    "@bentoco/promotion": "file:../medusa/packages/modules/promotion",
    "@bentoco/rbac": "file:../medusa/packages/modules/rbac",
    "@bentoco/region": "file:../medusa/packages/modules/region",
    "@bentoco/sales-channel": "file:../medusa/packages/modules/sales-channel",
    "@bentoco/stock-location": "file:../medusa/packages/modules/stock-location",
    "@bentoco/store": "file:../medusa/packages/modules/store",
    "@bentoco/tax": "file:../medusa/packages/modules/tax",
    "@bentoco/user": "file:../medusa/packages/modules/user",
    "@bentoco/workflow-engine-inmemory": "file:../medusa/packages/modules/workflow-engine-inmemory",
    "@bentoco/link-modules": "file:../medusa/packages/modules/link-modules",
    "@bentoco/admin-bundler": "file:../medusa/packages/admin/admin-bundler",
    "@bentoco/admin-sdk": "file:../medusa/packages/admin/admin-sdk",
    "@bentoco/admin-shared": "file:../medusa/packages/admin/admin-shared",
    "@bentoco/dashboard": "file:../medusa/packages/admin/dashboard",
    "@bentoco/admin-vite-plugin": "file:../medusa/packages/admin/admin-vite-plugin",
    "@bentoco/ui": "file:../medusa/packages/design-system/ui",
    "@bentoco/icons": "file:../medusa/packages/design-system/icons",
    "@bentoco/toolbox": "file:../medusa/packages/design-system/toolbox",
    "@bentoco/ui-preset": "file:../medusa/packages/design-system/ui-preset",
    "@bentoco/utils": "file:../medusa/packages/core/utils",
    "@bentoco/types": "file:../medusa/packages/core/types",
    "@bentoco/core-flows": "file:../medusa/packages/core/core-flows",
    "@bentoco/orchestration": "file:../medusa/packages/core/orchestration",
    "@bentoco/cli": "file:../medusa/packages/cli/medusa-cli",
    "@bentoco/modules-sdk": "file:../medusa/packages/core/modules-sdk",
    "@bentoco/workflows-sdk": "file:../medusa/packages/core/workflows-sdk",
    "@bentoco/js-sdk": "file:../../medusa/packages/core/js-sdk",
    "@bentoco/framework": "file:../medusa/packages/core/framework",
    "@bentoco/auth-emailpass": "file:../medusa/packages/modules/providers/auth-emailpass",
    "@bentoco/locking-redis": "file:../medusa/packages/modules/providers/locking-redis",
    "@bentoco/locking-postgres": "file:../medusa/packages/modules/providers/locking-postgres",
    "@bentoco/telemetry": "file:../medusa/packages/medusa-telemetry",
    "@bentoco/settings": "file:../medusa/packages/modules/settings",
    "@bentoco/draft-order": "file:../medusa/packages/plugins/draft-order",
    "@bentoco/loyalty-plugin": "file:../medusa/packages/plugins/loyalty",
    "@bentoco/deps": "file:../medusa/packages/deps",
    "@bentoco/caching-redis": "file:../medusa/packages/modules/providers/caching-redis",
    "@bentoco/caching": "file:../medusa/packages/modules/caching",
    "@bentoco/translation": "file:../medusa/packages/modules/translation",
}
```

If you're using `pnpm`, use `pnpm.overrides` instead of `resolutions`:

```
// .npmrc
shamefully-hoist=true
node-linker=hoisted
```

```json
// test project package.json (for pnpm)
"dependencies": {
    // more deps
    "@bentoco/admin-sdk": "link:../medusa/packages/admin/admin-sdk",
    "@bentoco/cli": "link:../medusa/packages/cli/medusa-cli",
    "@bentoco/framework": "link:../medusa/packages/core/framework",
    "@bentoco/medusa": "link:../medusa/packages/medusa",
},
"devDependencies": {
    // more dev deps
    "@bentoco/admin-shared": "link:../medusa/packages/admin/admin-shared",
    "@bentoco/dashboard": "link:../medusa/packages/admin/dashboard",
    "@bentoco/draft-order": "link:../medusa/packages/plugins/draft-order",
    "@bentoco/icons": "link:../medusa/packages/design-system/icons",
    "@bentoco/test-utils": "link:../medusa/packages/medusa-test-utils",
    "@bentoco/eslint-plugin": "link:../medusa/packages/eslint-plugin",
    "@bentoco/types": "link:../medusa/packages/core/types",
    "@bentoco/ui": "link:../medusa/packages/design-system/ui",
},
"pnpm": {
  "overrides": {
    // more overrides
      "@bentoco/test-utils": "link:../medusa/packages/medusa-test-utils",
      "@bentoco/api-key": "link:../medusa/packages/modules/api-key",
      "@bentoco/auth": "link:../medusa/packages/modules/auth",
      "@bentoco/cache-inmemory": "link:../medusa/packages/modules/cache-inmemory",
      "@bentoco/cache-redis": "link:../medusa/packages/modules/cache-redis",
      "@bentoco/cart": "link:../medusa/packages/modules/cart",
      "@bentoco/locking": "link:../medusa/packages/modules/locking",
      "@bentoco/currency": "link:../medusa/packages/modules/currency",
      "@bentoco/customer": "link:../medusa/packages/modules/customer",
      "@bentoco/event-bus-local": "link:../medusa/packages/modules/event-bus-local",
      "@bentoco/file": "link:../medusa/packages/modules/file",
      "@bentoco/file-local": "link:../medusa/packages/modules/providers/file-local",
      "@bentoco/fulfillment": "link:../medusa/packages/modules/fulfillment",
      "@bentoco/fulfillment-manual": "link:../medusa/packages/modules/providers/fulfillment-manual",
      "@bentoco/index": "link:../medusa/packages/modules/index",
      "@bentoco/inventory": "link:../medusa/packages/modules/inventory",
      "@bentoco/medusa": "link:../medusa/packages/medusa",
      "@bentoco/notification": "link:../medusa/packages/modules/notification",
      "@bentoco/notification-local": "link:../medusa/packages/modules/providers/notification-local",
      "@bentoco/order": "link:../medusa/packages/modules/order",
      "@bentoco/payment": "link:../medusa/packages/modules/payment",
      "@bentoco/pricing": "link:../medusa/packages/modules/pricing",
      "@bentoco/product": "link:../medusa/packages/modules/product",
      "@bentoco/promotion": "link:../medusa/packages/modules/promotion",
      "@bentoco/rbac": "link:../medusa/packages/modules/rbac",
      "@bentoco/region": "link:../medusa/packages/modules/region",
      "@bentoco/sales-channel": "link:../medusa/packages/modules/sales-channel",
      "@bentoco/stock-location": "link:../medusa/packages/modules/stock-location",
      "@bentoco/store": "link:../medusa/packages/modules/store",
      "@bentoco/tax": "link:../medusa/packages/modules/tax",
      "@bentoco/user": "link:../medusa/packages/modules/user",
      "@bentoco/workflow-engine-inmemory": "link:../medusa/packages/modules/workflow-engine-inmemory",
      "@bentoco/link-modules": "link:../medusa/packages/modules/link-modules",
      "@bentoco/admin-bundler": "link:../medusa/packages/admin/admin-bundler",
      "@bentoco/admin-sdk": "link:../medusa/packages/admin/admin-sdk",
      "@bentoco/admin-shared": "link:../medusa/packages/admin/admin-shared",
      "@bentoco/dashboard": "link:../medusa/packages/admin/dashboard",
      "@bentoco/admin-vite-plugin": "link:../medusa/packages/admin/admin-vite-plugin",
      "@bentoco/ui": "link:../medusa/packages/design-system/ui",
      "@bentoco/icons": "link:../medusa/packages/design-system/icons",
      "@bentoco/toolbox": "link:../medusa/packages/design-system/toolbox",
      "@bentoco/ui-preset": "link:../medusa/packages/design-system/ui-preset",
      "@bentoco/utils": "link:../medusa/packages/core/utils",
      "@bentoco/types": "link:../medusa/packages/core/types",
      "@bentoco/core-flows": "link:../medusa/packages/core/core-flows",
      "@bentoco/orchestration": "link:../medusa/packages/core/orchestration",
      "@bentoco/cli": "link:../medusa/packages/cli/medusa-cli",
      "@bentoco/modules-sdk": "link:../medusa/packages/core/modules-sdk",
      "@bentoco/workflows-sdk": "link:../medusa/packages/core/workflows-sdk",
      "@bentoco/js-sdk": "link:../medusa/packages/core/js-sdk",
      "@bentoco/framework": "link:../medusa/packages/core/framework",
      "@bentoco/auth-emailpass": "link:../medusa/packages/modules/providers/auth-emailpass",
      "@bentoco/locking-redis": "link:../medusa/packages/modules/providers/locking-redis",
      "@bentoco/locking-postgres": "link:../medusa/packages/modules/providers/locking-postgres",
      "@bentoco/telemetry": "link:../medusa/packages/medusa-telemetry",
      "@bentoco/settings": "link:../medusa/packages/modules/settings",
      "@bentoco/draft-order": "link:../medusa/packages/plugins/draft-order",
      "@bentoco/deps": "link:../medusa/packages/deps",
      "@bentoco/caching-redis": "link:../medusa/packages/modules/providers/caching-redis",
      "@bentoco/caching": "link:../medusa/packages/modules/caching",
      "@bentoco/translation": "link:../medusa/packages/modules/translation"
  }
}
```

2. Every time you make a change in the forked Medusa repository, you need to build the packages where the modifications took place with `yarn build`. Some packages have a watch script, so you can execute `yarn watch` once and it will automatically build on changes:

```bash
yarn build # or yarn watch
```

3. After building changes in the forked medusa repository, run the following command in the test project to regenerate the `node_modules` directory with the newly built contents from the previous step:

```bash
# For npm/yarn
rm -R node_modules && yarn && yarn dev

# For pnpm
rm -R node_modules && pnpm install && pnpm dev
```

## Workflow

### Branches

There are currently two base branches:

- `develop` - development of Medusa 2.0
- `v1.x` - development of Medusa v1.x

Note, if you wish to patch v1.x you should use `v1.x` as the base branch for your pull request. This is not the default when you clone the repository.

All changes should be part of a branch and submitted as a pull request - your branches should be prefixed with one of:

- `fix/` for bug fixes
- `feat/` for features
- `docs/` for documentation changes

### Commits

Strive towards keeping your commits small and isolated - this helps the reviewer understand what is going on and makes it easier to process your requests.

### Pull Requests

**Base branch**

If you wish to patch v1.x your base branch should be `v1.x`.

If your changes should result in a new version of Medusa, you will need to generate a **changelog**. Follow [this guide](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md) on how to generate a changeset.

Finally, submit your branch as a pull request. Your pull request should be opened against the `develop` branch in the main Medusa repo.

In your PR's description you should follow the structure:

- **What** - what changes are in this PR
- **Why** - why are these changes relevant
- **How** - how have the changes been implemented
- **Testing** - how has the changes been tested or how can the reviewer test the feature

We highly encourage that you do a self-review prior to requesting a review. To do a self review click the review button in the top right corner, go through your code and annotate your changes. This makes it easier for the reviewer to process your PR.

#### Merge Style

All pull requests are squashed and merged.

### Testing

All PRs should include tests for the changes that are included. We have two types of tests that must be written:

- **Unit tests** found under `packages/*/src/services/__tests__` and `packages/*/src/api/routes/*/__tests__`
- **Integration tests** found in `integration-tests/*/__tests__`

### Documentation

- We generally encourage to document your changes through comments in your code.
- If you alter user-facing behaviour you must provide documentation for such changes.
- All methods and endpoints should be documented using [TSDoc](https://tsdoc.org/).

### Release

The Medusa team will regularly create releases from two release branches:

- `develop` - preview releases of Medusa 2.0
- `v1.x` - official releases of Medusa 1.x
