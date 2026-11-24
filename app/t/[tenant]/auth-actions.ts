"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import type { ActionState } from "@/lib/utils";

export async function tenantLoginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const tenant = await getCurrentTenant();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Invalid email or password." };
  const member = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } } });
  if (!member) return { error: `You're not a member of ${tenant.name}.` };
  await setSessionCookie(user.id, tenant.slug);
  redirect("/contacts");
}

export async function acceptInviteAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const tenant = await getCurrentTenant();
  const token = String(form.get("token") ?? "");
  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (!invite || invite.tenantId !== tenant.id || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { error: "This invitation is invalid or has expired." };
  }
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();
  let user = await prisma.user.findUnique({ where: { email: invite.email } });

  if (user) {
    if (!(await verifyPassword(password, user.passwordHash))) return { error: "Incorrect password for this account." };
  } else {
    if (!name) return { fieldErrors: { name: "Your name is required" } };
    if (password.length < 8) return { fieldErrors: { password: "At least 8 characters" } };
    user = await prisma.user.create({ data: { email: invite.email, name, passwordHash: await hashPassword(password) } });
  }

  await prisma.$transaction([
    prisma.membership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: {},
      create: { tenantId: tenant.id, userId: user.id, role: invite.role },
    }),
    prisma.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  await setSessionCookie(user.id, tenant.slug);
  redirect("/contacts");
}
