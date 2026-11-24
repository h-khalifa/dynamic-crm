# Dynamic-CRM

A multi-tenant CRM whose vocabulary, fields and pipeline adapt to each tenant's industry.
In a clinic a *Contact* is a **Patient** and a *Deal* is an **Appointment**. In a real estate office they are
**Clients** and **Property Deals**.

There are two modules in one Next.js app:

| Module | Where | What |
| --- | --- | --- |
| Marketing | `ROOT_DOMAIN` (e.g. `localhost:3000`) | Landing page, features, pricing, MDX blog, signup and login |
| CRM | `{slug}.ROOT_DOMAIN` (e.g. `clinic.localhost:3000`) | Multi-tenant CRM: contacts, companies, deals (Kanban), activities, tasks, settings |

## Run it (Docker only, nothing to install on the host)

```bash
docker compose up -d db
docker compose run --rm app npx prisma migrate deploy   # create tables
docker compose run --rm app npx prisma db seed          # demo tenants (optional)
docker compose up app                                   # http://localhost:3000
```

The first start installs npm dependencies into a Docker volume. After that, startup is fast. Source is bind-mounted, so
edits hot-reload.

**Demo logins** (password `password123`):

| URL | User |
| --- | --- |
| http://clinic.localhost:3000 | `owner@clinic.test` (Clinic template) |
| http://realty.localhost:3000 | `owner@realty.test` (Real Estate template) |
| http://localhost:3000/login | `demo@dynamiccrm.test` (member of both, shows the workspace picker) |

`*.localhost` resolves to 127.0.0.1 in Chrome, Edge and Firefox with no DNS setup.

### Common commands

```bash
docker compose run --rm app npm test                    # unit + Postgres isolation tests
docker compose run --rm app npx tsc --noEmit            # typecheck
docker compose run --rm app npx prisma migrate dev --name <change>   # after editing schema.prisma
docker compose run --rm app npx prisma migrate reset --force         # wipe & reseed
docker build -t dynamic-crm .                           # production image (standalone)
```

## How it works

**Host routing.** [middleware.ts](middleware.ts) parses the `Host` header. Requests to a tenant subdomain are
rewritten into `app/t/[tenant]/…`, and the slug is passed to the server in an `x-tenant-slug` header. The middleware
always overwrites that header, so it can't be spoofed. `/t/*` is not reachable on the root domain.

**Tenant isolation.** The database is shared and every tenant table has `tenantId`. CRM code never uses the raw
Prisma client. It calls `requireMembership()` ([lib/tenant.ts](lib/tenant.ts)), which returns
`getTenantDb(tenantId)` ([lib/tenant-db.ts](lib/tenant-db.ts)). That is a Prisma extension that forces `tenantId`
into every query, create and update. See [tests/isolation.db.test.ts](tests/isolation.db.test.ts).

**Sessions.** Sessions are host-only signed cookies (JWT via `jose`), one per tenant subdomain. Signup and root login
issue a 2-minute *handoff* token that `/auth/handoff` on the tenant subdomain exchanges for a session.

**The dynamic layer.**
- `EntityDefinition` stores each tenant's singular, plural and icon per entity. `getTerms()` feeds every label in the UI.
- `FieldDefinition` stores custom fields (`customFields` JSONB on each record) and relabels built-in columns
  (`isSystem = true`).
- Forms are generated from field definitions ([components/crm/entity-form.tsx](components/crm/entity-form.tsx)) and
  validated by [lib/fields/validate.ts](lib/fields/validate.ts).
- Industry templates ([lib/templates/](lib/templates/)) seed terminology, fields and a pipeline at signup.

**Roles.** Roles are OWNER, ADMIN and MEMBER. Admins manage settings and invites. Owners change roles.

**Plans.** The plans are defined in [lib/plans.ts](lib/plans.ts). Every workspace starts on a 14-day trial, and the
record and user limits are enforced. Payment is behind the `BillingProvider` interface in
[lib/billing.ts](lib/billing.ts), which is currently a no-op, so Stripe can be added there later.

**Email.** Email goes through [lib/mailer.ts](lib/mailer.ts). In development it logs to the console, so invite links
appear in `docker compose logs app`. They are also shown on the Members settings page.

## Not yet implemented

- Payment gateway (Stripe) and self-serve plan changes
- Multiple pipelines per tenant
- Fully custom entity types
- Password reset and email verification
- Postgres row-level security as a second isolation layer
