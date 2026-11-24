"use server";

import { redirect } from "next/navigation";
import { billing } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { tenantUrl } from "@/lib/hosts";
import { verifyPassword } from "@/lib/password";
import { signHandoff } from "@/lib/session";
import { createWorkspace, SignupError, signupSchema } from "@/lib/signup";
import type { ActionState } from "@/lib/utils";

async function handoffUrl(userId: string, slug: string) {
  const token = await signHandoff(userId, slug);
  return tenantUrl(slug, `/auth/handoff?token=${encodeURIComponent(token)}`);
}

export async function signupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  let target: string;
  try {
    const { tenant, user } = await createWorkspace(parsed.data);
    const checkout = await billing.startCheckout({ tenantId: tenant.id, planCode: parsed.data.plan, email: user.email });
    target = checkout ?? (await handoffUrl(user.id, tenant.slug));
  } catch (e) {
    if (e instanceof SignupError) return e.field ? { fieldErrors: { [e.field]: e.message } } : { error: e.message };
    console.error(e);
    return { error: "Something went wrong creating your workspace." };
  }
  redirect(target);
}

export type Workspace = { name: string; slug: string; url: string };

/** Root-domain login: verifies credentials, then sends the user into one of their workspaces. */
export async function rootLoginAction(
  _prev: ActionState & { workspaces?: Workspace[] },
  form: FormData,
): Promise<ActionState & { workspaces?: Workspace[] }> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = email ? await prisma.user.findUnique({ where: { email }, include: { memberships: { include: { tenant: true } } } }) : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Invalid email or password." };
  if (user.memberships.length === 0) return { error: "This account doesn't belong to any workspace yet." };

  const workspaces = await Promise.all(
    user.memberships.map(async (m) => ({ name: m.tenant.name, slug: m.tenant.slug, url: await handoffUrl(user.id, m.tenant.slug) })),
  );
  if (workspaces.length === 1) redirect(workspaces[0].url);
  return { ok: true, workspaces };
}
