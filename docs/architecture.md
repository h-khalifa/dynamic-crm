# Dynamic-CRM: architecture, plan and progress

_Last updated: 2026-11-22. This is the approved plan and the source of truth for phase status. Tick boxes as work
lands._

## 1. Goal

Dynamic-CRM is a multi-tenant SaaS CRM. Each tenant renames the built-in entities and adds its own fields, so in a
clinic *Contact* becomes **Patient** and *Deal* becomes **Appointment**. Payment integration is out of scope for now
and sits behind a stub.

### Decisions

| Area | Choice |
| --- | --- |
| Stack | Next.js 15 (App Router, TypeScript), React 19, Tailwind v4 + shadcn-style components |
| Data | PostgreSQL 17 + Prisma 6 |
| Tenancy | Shared database with a `tenantId` column on every tenant table |
| Tenant addressing | Subdomain (`{slug}.ROOT_DOMAIN`). Marketing is on `ROOT_DOMAIN` |
| "Dynamic" scope | Rename entities, relabel built-in fields, custom fields, editable pipeline, industry templates |
| v1 entities | Contacts, Companies, Deals (Kanban), Activities, Tasks |
| Roles | OWNER / ADMIN / MEMBER |
| Blog | MDX files in `content/blog` |
| Signup | Self-serve with a 14-day trial. Plan limits are stored and enforced. Payment is stubbed |
| Language | English only. Every entity label comes from data |
| Dev environment | Docker only. Nothing is installed on the host |

**Deviation from the original plan:** auth uses a custom `jose` JWT session layer, not Auth.js.
- Sessions are host-only cookies, one per tenant subdomain, because cookies shared across subdomains are unreliable on
  `*.localhost`.
- Moving from the root domain into a tenant uses a signed handoff token that is valid for 2 minutes.
- As a side benefit, a session for one tenant can't be replayed on another tenant's subdomain.

## 2. Modules

| Module | Served on | Code | Responsibility |
| --- | --- | --- | --- |
| **Marketing** | `ROOT_DOMAIN` | `app/(marketing)`, `content/blog`, `components/marketing` | Landing (live industry relabel demo), features, pricing, MDX blog |
| **Platform / auth** | `ROOT_DOMAIN` + subdomains | `app/(auth)`, `app/api`, `app/t/[tenant]/{login,invite,auth}`, `lib/{session,signup,plans,billing,mailer,password}` | Signup (`createWorkspace`), root login with workspace picker, tenant login, handoff, invites, plans and limits, billing seam |
| **CRM** | `{slug}.ROOT_DOMAIN` | `app/t/[tenant]/(app)`, `components/crm`, `lib/crm` | Contacts, Companies, Deals and the Kanban board, Activities, Tasks, CSV import |
| **Dynamic config** | (used by the CRM) | `lib/{terms,entities,fields,templates}`, `app/t/[tenant]/(app)/settings` | Terminology, system labels, custom fields, pipeline stages, industry templates |
| **Tenancy core** | (used by everything tenant-side) | `middleware.ts`, `lib/{hosts,tenant,tenant-db,db}` | Host routing, tenant resolution, membership and roles, tenant-scoped data access |

## 3. Boundaries (rules that must hold)

1. **Host boundary.**
   - `middleware.ts` rewrites `{slug}.ROOT_DOMAIN/*` to `/t/{slug}/*`.
   - It sets `x-tenant-slug` and always overwrites it, so server code trusts only that header for the tenant.
   - On the root domain, `/t/*` returns 404, and `/api/*` is never rewritten.
2. **Data boundary.**
   - CRM code gets its database client only from `requireMembership()` → `getTenantDb(tenantId)`, which injects
     `tenantId` into every query and create and strips it from updates.
   - The raw `lib/db.ts` client is platform-only: auth, signup, tenant lookup, templates and seed.
   - New tenant models must be added to `TENANT_MODELS`.
   - Client-supplied link ids are re-verified (`lib/crm/links.ts`).
3. **Session boundary.**
   - Each session cookie is bound to one tenant slug.
   - Entering a tenant from the root domain requires the handoff token (`/auth/handoff`).
4. **Role boundary.**
   - MEMBER works with data.
   - ADMIN manages settings and invites.
   - OWNER changes roles and removes owners.
   - These rules are enforced in server actions, not just in the UI.
5. **Vocabulary boundary.** UI code never hardcodes entity names. Labels come from `getTerms()` and
   `getFieldConfig()`, and forms are built from `FormField[]` lists.
6. **Integration seams.**
   - Payments go only through `BillingProvider` (`lib/billing.ts`).
   - Email goes only through `Mailer` (`lib/mailer.ts`).
   - Plans come only from `PLAN_CATALOG` (`lib/plans.ts`).

### Request flow

```
Host: clinic.localhost:3000 → middleware (parseHost, x-tenant-slug, rewrite /t/clinic/…)
  → app/t/[tenant]/layout.tsx         getCurrentTenant()   → 404 if unknown
  → app/t/[tenant]/(app)/layout.tsx   requireMembership()  → /login if signed out
  → page / server action              ctx.db = getTenantDb(tenant.id)
```

### Data model

- **Platform:** `Plan`, `Tenant`, `User`, `Membership(role)`, `Invitation`.
- **Dynamic config:**
  - `EntityDefinition(entityKey, singular, plural, icon)`
  - `FieldDefinition(entityKey, key, label, type, options, required, isSystem, showInList, order, archived)`
- **Records:** `Company`, `Contact`, `Pipeline`, `Stage`, `Deal` (value in cents), `Activity`, `Task`.
  - Every record has `tenantId`, and every record except `Pipeline` and `Stage` has `customFields` JSONB.
- **Templates:** `lib/templates/*` (clinic, real-estate, agency, generic) seed terms, fields and the pipeline through
  `applyTemplate()` inside the signup transaction.

## 4. Build phases

Each phase ends at a **stop point**: a set of checks that must pass before the next phase starts. Work pauses there
for review.

### Phase 1: Scaffold
- [x] Next.js + TypeScript + Tailwind v4 + shadcn-style UI kit
- [x] Prisma + Postgres in Docker Compose. Dev image with dependencies in a volume and an auto-install entrypoint
- [x] Vitest
- [x] Production multi-stage `Dockerfile` (standalone, non-root, migrates on start)
- [ ] ESLint / Prettier (planned, not set up yet)

**Stop point:** `docker compose up app` serves `http://localhost:3000`, and `tsc --noEmit` is clean.
- **Status:** ✅ met. The lint item is carried to Phase 7.

### Phase 2: Data and tenancy core
- [x] Prisma schema (platform + dynamic config + CRM records) and the initial migration
- [x] `getTenantDb()` tenant-scoped client with the `scopeArgs()` rules
- [x] Host-routing middleware with the `x-tenant-slug` header
- [x] Sessions (custom `jose` layer, replacing Auth.js) and handoff tokens
- [x] `requireMembership()` guard with roles

**Stop point:**
- Isolation tests pass against real Postgres.
- On the root domain, `/t/*` returns 404 and an unknown tenant returns 404.
- A signed-out user is redirected to `/login`.
- One tenant's session is rejected on another tenant's subdomain.
- **Status:** ✅ met (vitest plus curl checks).

### Phase 3: Marketing module
- [x] Landing page with a live industry-relabel demo, features page and testimonials
- [x] Pricing page from `PLAN_CATALOG`, with CTAs linking to `/signup?plan=…`
- [x] MDX blog (index and post pages, GFM tables) with 3 sample posts
- [x] Signup: template picker, live slug check, atomic `createWorkspace`, handoff to the subdomain
- [x] Root login with a workspace picker, and tenant login
- [x] Payment seam: no-op `BillingProvider`

**Stop point:** all marketing routes return 200, and signup creates a tenant with template terminology (DB test).
- **Status:** ✅ met. The browser click-through of signup is covered in Phase 7.

### Phase 4: CRM entities
- [x] Contacts and Companies: list (search, custom-field filters, pagination), create/edit with dynamic fields,
  detail page with timeline and tasks
- [x] Contact CSV import with column mapping and per-row validation
- [x] Deals: Kanban board (dnd-kit, optimistic moves) and list view, create/edit/detail
- [x] Activities: timeline, type filter, quick composer linked to records
- [x] Tasks: open, mine, overdue and done filters, optimistic completion, quick add
- [x] Plan limits enforced on contact create and import

**Stop point:** every CRM page renders with the tenant's vocabulary (Clinic shows Patients and Appointments; realty
shows Clients and Property Deals).
- **Status:** ✅ met (curl render checks). Form submits and drag-and-drop are browser-checked in Phase 7.

### Phase 5: Settings
- [x] Workspace name and plan/usage meters
- [x] Terminology editor (singular, plural, icon per entity)
- [x] Custom fields: add, edit, reorder, archive and restore; built-in field relabeling
- [x] Pipeline stages: rename, recolor, set probability, reorder, add, delete (blocked while deals are in a stage)
- [x] Members: invite with a console mailer and an invite link, accept the invite, change roles, remove members,
  revoke invites
- [x] Role checks in every settings action (ADMIN, and OWNER for role changes)

**Stop point:** all settings tabs render for admins and are hidden from members.
- **Status:** ✅ met. Checking in a browser that a rename shows up everywhere is covered in Phase 7.

### Phase 6: Polish
- [x] Seed: `clinic` and `realty` demo tenants and a shared `demo@dynamiccrm.test` user
- [x] Empty states, loading skeleton, error boundary
- [x] README, `CLAUDE.md` and this document
- [x] Production image verified (pages served; no data leak in the RSC payload)

**Stop point:** a fresh `migrate deploy` plus `db seed` gives working demo logins, and the prod image serves pages.
- **Status:** ✅ met.

### Phase 7: End-to-end verification ← **next**
- [x] Playwright spec `e2e/crm.spec.ts` and `docker-compose.e2e.yml` (prod image on `dcrm.test`, Chromium resolver
  mapping)
- [ ] Install `@playwright/test` (`docker compose run --rm app npm install`), which updates the lockfile
- [ ] Rebuild the prod image and run:
  `docker compose -f docker-compose.yml -f docker-compose.e2e.yml run --rm e2e`
- [ ] Fix whatever the run exposes in the server-action flows (signup, login, forms, Kanban, settings, invites)
- [ ] ESLint / Prettier (carried over from Phase 1)

**Stop point:** both e2e tests pass. The first covers signup → patient → visit note → appointment → drag to Confirmed
→ rename Patient to Client → add a custom field. The second covers the workspace picker and cross-tenant rejection.
- **Status:** ⬜ not met.

### Phase 8+ (backlog, not started)
- [ ] Payments: a Stripe `BillingProvider` and self-serve plan changes and upgrades
- [ ] Enforce trial expiry (today a banner shows but access continues)
- [ ] Password reset, email verification and a real `Mailer` provider
- [ ] Security hardening: Postgres RLS as a second layer, rate limiting on login and signup, single-use handoff
  tokens
- [ ] Multiple pipelines per tenant
- [ ] Fully custom entity types
- [ ] Dashboard and reports
- [ ] i18n / RTL
- [ ] Kubernetes manifests

## 5. Environments

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | `db` (Postgres 17, plus a `crm_test` DB; not published to the host because 5432 is taken) and `app` (dev server, source bind-mounted) |
| `Dockerfile.dev` + `docker/dev-entrypoint.sh` | Syncs dependencies when `package.json` changes, then runs `prisma generate` |
| `Dockerfile` | Production image (Next standalone, runs `prisma migrate deploy` on start, non-root user) |
| `docker-compose.e2e.yml` | `web` (prod image on `dcrm.test:3000`) and `e2e` (Playwright 1.55 image) |

## 6. Housekeeping

- **Temporary prod container:** `dcrm-prod` is still running on port 3001. Remove it with `docker rm -f dcrm-prod`.
- **Test helper in the volume:** `node_modules/.sign.mjs` (in the Docker volume, not the repo) was used to mint test
  sessions.
- **Prisma 7 warning:** move the `package.json#prisma` seed config to `prisma.config.ts` when upgrading to Prisma 7.
