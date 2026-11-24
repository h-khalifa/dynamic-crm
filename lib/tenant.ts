import "server-only";
import type { Role } from "@prisma/client";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";
import { TENANT_HEADER } from "./hosts";
import { readSession } from "./session";
import { getTenantDb } from "./tenant-db";

const ROLE_RANK: Record<Role, number> = { MEMBER: 1, ADMIN: 2, OWNER: 3 };

export function hasRole(role: Role, min: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export const getTenantBySlug = cache(async (slug: string) =>
  prisma.tenant.findUnique({ where: { slug }, include: { plan: true } }),
);

/** The tenant for the current request (from the host, via middleware). 404s on the root domain. */
export const getCurrentTenant = cache(async () => {
  const slug = (await headers()).get(TENANT_HEADER);
  if (!slug) notFound();
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  return tenant;
});

/** Current user + membership in the current tenant, or null when not signed in here. */
export const getCurrentMember = cache(async () => {
  const tenant = await getCurrentTenant();
  const session = await readSession(tenant.slug);
  if (!session) return null;
  const membership = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.id, userId: session.userId } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return membership;
});

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
  }
}

/**
 * Gate for every CRM page and server action. Redirects to the tenant login when signed out,
 * throws ForbiddenError when the role is too low, and returns a tenant-scoped db client.
 */
export async function requireMembership(minRole: Role = "MEMBER") {
  const tenant = await getCurrentTenant();
  const membership = await getCurrentMember();
  if (!membership) redirect("/login");
  if (!hasRole(membership.role, minRole)) throw new ForbiddenError();
  return { tenant, membership, user: membership.user, db: getTenantDb(tenant.id) };
}

export type AuthContext = Awaited<ReturnType<typeof requireMembership>>;
