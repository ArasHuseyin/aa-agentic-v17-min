# Reviewer quick start for AA Agentic V17 Min

Use this file as the Partner Dashboard review note source.

## Smoke test

- Install on a clean development store and complete OAuth.
- Confirm the app loads on its selected surface: embedded-admin.
- Exercise the primary merchant workflow described in the listing.
- Confirm GDPR webhooks, support, privacy, data-retention, status, health, and version endpoints.
- Plus-only checkout instructions are not required for this app surface.

## Scope justification

| Scope | Justification |
|---|---|
| `read_products` | This app uses `read_products` to read product catalog data used by the selected app features. |
| `write_products` | This app uses `write_products` to write product updates requested by merchant workflows. |
| `read_inventory` | This app uses `read_inventory` to read inventory data for availability or bundle calculations. |
| `write_inventory` | This app uses `write_inventory` to write inventory adjustments triggered by merchant workflows. |

## Webhooks

- `products/update` - verify HMAC before processing and log success/failure.
- Mandatory GDPR webhooks - verify HMAC before processing data request/redact events.
