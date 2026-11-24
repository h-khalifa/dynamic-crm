import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma as defaultClient } from "./db";
import { isValidSlug } from "./hosts";
import { hashPassword, verifyPassword } from "./password";
import { ensurePlans, PLAN_CATALOG, TRIAL_DAYS } from "./plans";
import { applyTemplate, TEMPLATES } from "./templates";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email({ message: "Enter a valid email" })),
  password: z.string().min(8, "At least 8 characters").max(200),
  companyName: z.string().trim().min(1, "Workspace name is required").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlug, "3–32 lowercase letters, numbers or dashes (some names are reserved)"),
  template: z.enum(TEMPLATES.map((t) => t.key) as [string, ...string[]]),
  plan: z.enum(PLAN_CATALOG.map((p) => p.code) as [string, ...string[]]).default("trial"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export class SignupError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
  }
}

/**
 * Creates the owner (or reuses an existing account after verifying its password), the
 * tenant on a trial, the OWNER membership, and applies the industry template, all atomically.
 */
export async function createWorkspace(input: SignupInput, client: PrismaClient = defaultClient) {
  if (await client.tenant.findUnique({ where: { slug: input.slug } })) {
    throw new SignupError("That workspace address is taken", "slug");
  }
  const existing = await client.user.findUnique({ where: { email: input.email } });
  if (existing && !(await verifyPassword(input.password, existing.passwordHash))) {
    throw new SignupError("An account with this email exists. Enter its password to add a new workspace.", "email");
  }
  const passwordHash = existing ? null : await hashPassword(input.password);

  return client.$transaction(async (tx) => {
    await ensurePlans(tx);
    const plan = await tx.plan.findUniqueOrThrow({ where: { code: input.plan } });
    const user = existing ?? (await tx.user.create({ data: { email: input.email, name: input.name, passwordHash: passwordHash! } }));
    const tenant = await tx.tenant.create({
      data: {
        slug: input.slug,
        name: input.companyName,
        template: input.template,
        planId: plan.id,
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86400_000),
      },
    });
    await tx.membership.create({ data: { tenantId: tenant.id, userId: user.id, role: "OWNER" } });
    await applyTemplate(tx, tenant.id, input.template);
    return { tenant, user };
  });
}
