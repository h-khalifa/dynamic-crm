import type { Plan, Prisma, PrismaClient } from "@prisma/client";

/** Source of truth for the pricing page and the Plan table (upserted by seed / signup). */
export const PLAN_CATALOG = [
  {
    code: "trial",
    name: "Free trial",
    priceMonthly: 0,
    maxUsers: 3,
    maxContacts: 500,
    sortOrder: 0,
    features: ["14 days, no card required", "Up to 3 users", "500 records", "All industry templates"],
  },
  {
    code: "starter",
    name: "Starter",
    priceMonthly: 1900,
    maxUsers: 5,
    maxContacts: 5000,
    sortOrder: 1,
    features: ["Up to 5 users", "5,000 records", "Custom fields & terminology", "CSV import", "Email support"],
  },
  {
    code: "pro",
    name: "Pro",
    priceMonthly: 4900,
    maxUsers: 25,
    maxContacts: 50000,
    sortOrder: 2,
    features: ["Up to 25 users", "50,000 records", "Multiple pipelines (soon)", "Priority support", "Everything in Starter"],
  },
] as const;

export type PlanCode = (typeof PLAN_CATALOG)[number]["code"];
export const TRIAL_DAYS = 14;

export async function ensurePlans(db: PrismaClient | Prisma.TransactionClient) {
  for (const p of PLAN_CATALOG) {
    const data = { ...p, features: [...p.features] };
    await db.plan.upsert({ where: { code: p.code }, update: data, create: data });
  }
}

export class PlanLimitError extends Error {}

/** `current` = existing contacts in the tenant. */
export function assertCanAddContacts(plan: Plan, current: number, adding = 1) {
  if (current + adding > plan.maxContacts) {
    throw new PlanLimitError(`Your ${plan.name} plan allows ${plan.maxContacts.toLocaleString()} records. Upgrade to add more.`);
  }
}

/** `seats` = members + pending invitations. */
export function assertCanAddUser(plan: Plan, seats: number) {
  if (seats + 1 > plan.maxUsers) {
    throw new PlanLimitError(`Your ${plan.name} plan allows ${plan.maxUsers} users. Upgrade to invite more.`);
  }
}

export function formatPrice(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(0)}`;
}
