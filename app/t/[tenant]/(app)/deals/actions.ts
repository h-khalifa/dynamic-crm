"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { optStr, prefixErrors, str } from "@/lib/crm/form-fields";
import { verifyLinks } from "@/lib/crm/links";
import { readCustomFieldsFromForm, validateCustomFields } from "@/lib/fields/validate";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig } from "@/lib/terms";
import type { ActionState } from "@/lib/utils";

export async function saveDeal(id: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { tenant, user, db } = await requireMembership();
  const { custom, system } = await getFieldConfig(tenant.id, "DEAL");
  const existing = id ? await db.deal.findFirst({ where: { id } }) : null;
  if (id && !existing) return { error: "Record not found." };

  const fieldErrors: Record<string, string> = {};
  const title = str(form, "title");
  if (!title) fieldErrors.title = `${system.title} is required`;
  const valueRaw = str(form, "value");
  const value = valueRaw ? Math.round(Number(valueRaw) * 100) : 0;
  if (!Number.isFinite(value) || value < 0) fieldErrors.value = "Must be a positive number";
  const stageId = str(form, "stageId");
  const stage = stageId ? await db.stage.findFirst({ where: { id: stageId } }) : null;
  if (!stage) fieldErrors.stageId = "Pick a stage";
  const links = await verifyLinks(db, { contactId: optStr(form, "contactId"), companyId: optStr(form, "companyId") });
  if (!links) fieldErrors.contactId = "Linked record not found";
  const cf = validateCustomFields(readCustomFieldsFromForm(form, custom), custom);
  Object.assign(fieldErrors, prefixErrors(cf.errors));
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const data = {
    title,
    value,
    stageId: stage!.id,
    contactId: links!.contactId ?? null,
    companyId: links!.companyId ?? null,
    customFields: { ...((existing?.customFields as object) ?? {}), ...cf.data },
  };
  let recordId = id;
  if (existing) await db.deal.update({ where: { id: existing.id }, data });
  else recordId = (await db.deal.create({ data: { ...data, tenantId: tenant.id, ownerId: user.id, createdById: user.id } })).id;
  redirect(`/deals/${recordId}`);
}

/** Kanban drag & drop. */
export async function moveDeal(dealId: string, stageId: string) {
  const { db } = await requireMembership();
  const [deal, stage] = await Promise.all([db.deal.findFirst({ where: { id: dealId } }), db.stage.findFirst({ where: { id: stageId } })]);
  if (!deal || !stage) throw new Error("Not found");
  await db.deal.update({ where: { id: deal.id }, data: { stageId: stage.id } });
  revalidatePath("/", "layout");
}

export async function deleteDeal(id: string) {
  const { db } = await requireMembership();
  await db.deal.deleteMany({ where: { id } });
  redirect("/deals");
}
