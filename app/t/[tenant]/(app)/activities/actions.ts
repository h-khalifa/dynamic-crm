"use server";

import type { ActivityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { optStr, str } from "@/lib/crm/form-fields";
import { verifyLinks, type RecordLinks } from "@/lib/crm/links";
import { ACTIVITY_TYPES } from "@/lib/entities";
import { requireMembership } from "@/lib/tenant";
import type { ActionState } from "@/lib/utils";

export async function createActivity(fixedLinks: RecordLinks, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { db, user, tenant } = await requireMembership();
  const subject = str(form, "subject");
  if (!subject) return { fieldErrors: { subject: "Required" } };
  const typeRaw = str(form, "type") as ActivityType;
  const type = (ACTIVITY_TYPES as readonly string[]).includes(typeRaw) ? typeRaw : "NOTE";
  const date = str(form, "occurredAt");

  const links = await verifyLinks(db, {
    contactId: fixedLinks.contactId ?? optStr(form, "contactId"),
    companyId: fixedLinks.companyId ?? optStr(form, "companyId"),
    dealId: fixedLinks.dealId ?? optStr(form, "dealId"),
  });
  if (!links) return { error: "Linked record not found." };

  await db.activity.create({
    data: {
      tenantId: tenant.id,
      type,
      subject,
      body: str(form, "body"),
      occurredAt: date ? new Date(date) : new Date(),
      createdById: user.id,
      ...links,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Logged" };
}

export async function deleteActivity(id: string) {
  const { db } = await requireMembership();
  await db.activity.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
}
