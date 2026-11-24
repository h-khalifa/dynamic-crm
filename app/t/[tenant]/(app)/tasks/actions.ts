"use server";

import { revalidatePath } from "next/cache";
import { optStr, str } from "@/lib/crm/form-fields";
import { requireMembership } from "@/lib/tenant";
import type { ActionState } from "@/lib/utils";
import { verifyLinks, type RecordLinks } from "@/lib/crm/links";

export async function createTask(fixedLinks: RecordLinks, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { db, user, tenant } = await requireMembership();
  const title = str(form, "title");
  if (!title) return { fieldErrors: { title: "Required" } };
  const due = str(form, "dueAt");
  const assigneeId = optStr(form, "assigneeId");
  if (assigneeId && !(await db.membership.findFirst({ where: { userId: assigneeId } }))) return { error: "Unknown assignee." };

  const links = await verifyLinks(db, {
    contactId: fixedLinks.contactId ?? optStr(form, "contactId"),
    companyId: fixedLinks.companyId ?? optStr(form, "companyId"),
    dealId: fixedLinks.dealId ?? optStr(form, "dealId"),
  });
  if (!links) return { error: "Linked record not found." };

  await db.task.create({
    data: {
      tenantId: tenant.id,
      title,
      dueAt: due ? new Date(due) : null,
      assigneeId: assigneeId ?? user.id,
      createdById: user.id,
      ...links,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleTask(id: string, done: boolean) {
  const { db } = await requireMembership();
  await db.task.updateMany({ where: { id }, data: { done } });
  revalidatePath("/", "layout");
}

export async function deleteTask(id: string) {
  const { db } = await requireMembership();
  await db.task.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
}
