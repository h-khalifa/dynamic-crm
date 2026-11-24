# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Dynamic-CRM is a multi-tenant CRM where each tenant renames the built-in entities and adds custom fields (for example, Contact becomes Patient in a clinic). A single Next.js 15 app (App Router, React 19, Prisma 6 + Postgres 17, Tailwind v4) serves two modules. The marketing site runs on `ROOT_DOMAIN`, and each tenant's CRM runs on `{slug}.ROOT_DOMAIN`. The approved plan, module boundaries and phase status are in the file below, which is loaded in every session. Work
phase by phase, stop at each phase's stop point for review, and tick its checkboxes when work lands.

@docs/architecture.md

## Commands: Docker only

The user does not want Node, npm or Postgres installed or run on the host. Every command goes through containers:

```bash
docker compose up -d db                                   # Postgres (not published to host; 5432 is taken)
docker compose up app                                     # dev server → http://localhost:3000
docker compose run --rm app npx tsc --noEmit              # typecheck (also run by `next build`)
docker compose run --rm app npm test                      # vitest: unit + Postgres tests
docker compose run --rm app npx vitest run tests/hosts.test.ts       # single file
docker compose run --rm app npx vitest run -t "scopeArgs"            # single test by name
docker compose run --rm app npx prisma migrate dev --name <change>   # after editing prisma/schema.prisma
docker compose run --rm app npx prisma db seed            # demo tenants (idempotent)
docker compose run --rm app npx prisma migrate reset --force         # wipe + reseed
docker build -t dynamic-crm:prod .                        # production image (standalone; migrates on start)
docker compose -f docker-compose.yml -f docker-compose.e2e.yml run --rm e2e   # Playwright, needs prod image
```

- **Dependencies:** `docker/dev-entrypoint.sh` reinstalls them into the `node_modules` volume whenever `package.json` or the lockfile changes. Edit `package.json`; don't run `npm install` on the host.
- **Test database:** `npm test` migrates the `crm_test` database (`TEST_DATABASE_URL`, created by `docker/init-test-db.sql`) before running vitest. DB tests (`tests/*.db.test.ts`) are skipped when that variable is unset.
- **Demo logins (password `password123`):**
  - `owner@clinic.test` at http://clinic.localhost:3000
  - `owner@realty.test` at http://realty.localhost:3000
  - `demo@dynamiccrm.test` at http://localhost:3000/login (a member of both, so it gets the workspace picker)
- **E2E:** tests run against the prod image on the fake domain `dcrm.test:3000`. Chromium's `--host-resolver-rules` maps `*.dcrm.test` to the `web` container (see `playwright.config.ts`).

## Architecture

### Host routing
`middleware.ts` uses `parseHost()` from `lib/hosts.ts`:
- A tenant subdomain gets its path rewritten to `/t/{slug}/...`, and the middleware sets the `x-tenant-slug` request header. That header is always overwritten, so server code trusts it and never takes the slug from client input.
- On the root domain, `/t/*` returns 404, and `/api/*` is never rewritten.
- `app/t/[tenant]/(app)/` contains the authenticated CRM pages. Login, invite, `auth/handoff` and `auth/logout` sit outside the `(app)` group.
- Links and redirects inside a tenant use tenant-relative paths (`/contacts`), not `/t/slug/contacts`. Use `tenantUrl()` / `rootUrl()` to cross domains.

### Tenant isolation (the critical invariant)
- CRM pages and server actions must start with `requireMembership(minRole?)` from `lib/tenant.ts`. It returns `{ tenant, membership, user, db }`, where `db = getTenantDb(tenant.id)` from `lib/tenant-db.ts`.
- `getTenantDb` is a Prisma `$extends` extension that injects `tenantId` into every where clause, create and upsert, and strips `tenantId` from updates. The rules live in the pure function `scopeArgs()`, which is unit-tested.
- The raw `prisma` client from `lib/db.ts` is only for platform code: auth, signup, tenant lookup, templates and seed.
- When adding a model that has `tenantId`, also add it to `TENANT_MODELS`.
- Write foreign keys as scalars (`contactId`), never as nested `connect`.
- Client-supplied link ids must be re-checked through the scoped client (`lib/crm/links.ts`).
- Fetch single records with `db.x.findFirst({ where: { id } })`; it returns null for another tenant's row.
- `Tenant`, `User` and `Plan` are not scoped, so filter them explicitly.

### Sessions
This project uses a custom auth layer (`lib/session.ts`, `jose`), not Auth.js:
- Session cookies are host-only, one per tenant subdomain, and the JWT carries the tenant slug.
- Signup and root login issue a 2-minute handoff token, which `app/t/[tenant]/auth/handoff/route.ts` exchanges for a session cookie on the subdomain.

### The "dynamic" layer
- **No entity names are hardcoded in UI code.** Labels come from `getTerms(tenantId)` in `lib/terms.ts`, which reads `EntityDefinition` rows (singular, plural, icon).
- **Field config:** `getFieldConfig(tenantId, entityKey)` returns `{ system, custom }`:
  - `system` holds labels for built-in columns, overridden by `FieldDefinition` rows with `isSystem=true`. The defaults are in `SYSTEM_FIELDS` in `lib/entities.ts`.
  - `custom` holds the active custom fields, whose values are stored in each record's `customFields` JSONB.
- **Forms are data-driven:**
  1. Each entity has a `form-fields.ts` that builds a `FormField[]` (system fields first, then `customFormFields()`).
  2. `components/crm/entity-form.tsx` renders the list.
  3. On the server, custom-field inputs are named `cf.<key>`. They are parsed with `readCustomFieldsFromForm` and validated with `validateCustomFields` (`lib/fields/validate.ts`), and errors are mapped back with `prefixErrors`.
  4. On update, merge new values into the existing `customFields` so values of archived fields are kept.
- **Industry templates** (`lib/templates/*.ts`) seed terminology, fields and the default pipeline through `applyTemplate()` inside the `createWorkspace()` transaction in `lib/signup.ts`.

### Server action conventions
- Actions live beside their pages (`.../contacts/actions.ts`). They return `ActionState` from `lib/utils.ts` for `useActionState`, and receive ids by `.bind(null, id)`.
- Bound arguments can be tampered with by the client, so always re-verify them through the scoped db.
- Every export of a `"use server"` file becomes a callable endpoint. Keep helpers in `lib/`.
- Actions that don't redirect call `revalidatePath("/", "layout")`.

### Seams for later work
- `lib/billing.ts` (`BillingProvider`, currently a no-op) is where payments go.
- `lib/mailer.ts` logs mail to the console in dev.
- `lib/plans.ts` holds `PLAN_CATALOG`, the source of truth for the pricing page and the `Plan` rows. It also has the limit checks.

## Gotchas
- **Dev-only RSC data:** in development, React 19 serializes awaited server data into the RSC payload as debug info. Check for data leaks against the prod image, not `next dev`.
- **Server components:** they can't take event handlers. Use the client helpers in `components/crm/action-form.tsx` (`ActionForm`, `ActionButton`) or `delete-button.tsx`.
- **Money:** `Deal.value` is stored in cents. CURRENCY custom fields are stored in major units.
