# AA Agentic V17 Min

Shopify App scaffolded by [AppApprove](https://appapprove.com). Built on
Remix + Cloudflare Workers.

## Overview

**AA Agentic V17 Min** is a Shopify embedded admin app that lets merchants
define product bundles (a parent product + N child products with quantities
and a bundle-only price). A storefront block on the product detail page
surfaces the bundle option to shoppers, and inventory deduction on a bundle
purchase automatically decrements each child product by its configured
quantity multiplier.

## Features

- **Admin Dashboard** — Polaris-based settings panel and status overview
  embedded inside the Shopify admin (App Bridge JWT auth, no cookies).
- **Bundle Management** — Define a bundle: choose a parent product, attach
  child products with per-child quantities, and set a bundle-only price.
- **Storefront Block** — Checkout UI extension renders the bundle option on
  the product detail page.
- **Inventory Deduction** — On bundle purchase, each child product's
  inventory is decremented by `N × child quantity`.
- **Customer-Facing Route** — A public (no admin auth) route at
  `/customer/bundle` for storefront-side bundle data.

## Pricing

| Plan    | Price      | Trial  |
|---------|-----------|--------|
| Pro     | $19 / mo  | 7 days |

Billing is declared in `pricing.yaml`. Sprint 25 codegen emits the
Billing API calls from that YAML — do not hand-write them.

## Webhooks

| Topic            | Handler                                    |
|------------------|--------------------------------------------|
| products/update  | `app/webhooks/products-update.ts`          |
| customers/data_request | `app/webhooks/customers-data-request.ts` |
| customers/redact | `app/webhooks/customers-redact.ts`         |
| shop/redact      | `app/webhooks/shop-redact.ts`              |

All webhook handlers are HMAC-verified by `app/lib/webhook-router.server.ts`.

## Scopes

```
read_products, write_products, read_inventory, write_inventory
```

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Deploy

This repo is automatically deployed by AppApprove on every push to `main`.
Your live URL is `https://aa-agentic-v17-min.appapprove.app`.

## What's in here

- `app/` - Remix routes and components
- `app/routes/_index.tsx` - Embedded admin dashboard (settings + status)
- `app/routes/customer.bundle.tsx` - Public customer-facing bundle route
- `app/webhooks/` - Shopify webhook handlers (HMAC-verified by app/lib/webhook-router.server.ts)
- `app/crons/` - CF Cron Trigger handlers (dispatched by app/lib/cron-router.server.ts)
- `app/lib/review-evidence.ts` - reviewer setup, screencast, credential, and data-retention checklist
- `app/lib/sync.server.ts` - starter helpers for GraphQL backfill, webhook upserts, and replay-safe sync
- `extensions/` - editable theme app extension and Shopify Function starters
- `tests/` - generated review and webhook smoke tests
- `shopify.app.toml` - Shopify App configuration (synced to Partner Dashboard by AppApprove)
- `appapprove.config.ts` - webhook routes, cron handlers, build hooks, env mapping
- `pricing.yaml` - declarative billing plans (edit here; codegen emits API calls)
- `wrangler.toml` - Cloudflare Workers runtime config

## Background jobs

Cron schedules and CF Queues are declared in two places that must stay
in sync: `appapprove.config.ts` (handler dispatch) and `wrangler.toml`
(`[triggers]` + `[[queues.*]]`). The deploy pipeline diffs the two on
every push and warns when they drift.

To add an hourly cleanup job:

1. `app/crons/cleanup.ts` - write your handler (see `example-cleanup.ts`)
2. `appapprove.config.ts` - add `"0 * * * *": "~/crons/cleanup"` to `crons`
3. `wrangler.toml` - uncomment `[triggers]` and add the same schedule

## Bundle feature — implementation notes

### Admin flow

1. Merchant opens the dashboard (`/`) and navigates to **Bundle Settings**.
2. They select a parent product (via Shopify ResourcePicker), add child
   products with quantities, and set a bundle price.
3. On save, the bundle config is persisted and a `captureSetupStep` event
   fires so the AppApprove QA timeline records the milestone.

### Storefront flow

The checkout UI extension (`extensions/checkout-ui`) reads the bundle
metafield on the parent product and renders child items + bundle price.

### Inventory deduction

The `products/update` webhook handler (`app/webhooks/products-update.ts`)
listens for bundle-parent updates. Inventory adjustments for child products
use the `shopifyAdmin` helper from `app/lib/shopify-api.server.ts` — never
raw `fetch()` against `*.myshopify.com`.

## Conventions

- **Admin API calls** always go through `shopifyAdmin({ env, session, shop })`
  from `~/lib/shopify-api.server`. Never call `fetch()` directly against
  `*.myshopify.com/admin/...`.
- **Setup milestones** call `captureSetupStep(env, "<step-id>", { ... })`
  from `~/lib/merchant-qa.server`.
- **Auth** uses App Bridge JWT session tokens — no cookies.
- **CF Workers** compatible only — no Node-only APIs (`fs`, `child_process`,
  `crypto.createHash`). Use `globalThis.crypto.subtle` instead.

Edit anything you like. Open the project in the AppApprove Vibecode editor
for AI-assisted changes with live preview.