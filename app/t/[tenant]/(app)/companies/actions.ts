"use server";

import { redirect } from "next/navigation";
import { optStr, prefixErrors, str } from "@/lib/crm/form-fields";
import { readCustomFieldsFromForm, validateCustomFields } from "@/lib/fields/validate";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig } from "@/lib/terms";
import type { ActionState } from "@/lib/utils";

export async function saveCompany(id: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { tenant, user, db } = await requireMembership();
  const { custom, system } = await getFieldConfig(tenant.id, "COMPANY");
  const existing = id ? await db.company.findFirst({ where: { id } }) : null;
  if (id && !existing) return { error: "Record not found." };

  const fieldErrors: Record<string, string> = {};
  const name = str(form, "name");
  if (!name) fieldErrors.name = `${system.name} is required`;
  const cf = validateCustomFields(readCustomFieldsFromForm(form, custom), custom);
  Object.assign(fieldErrors, prefixErrors(cf.errors));
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const data = {
    name,
    domain: optStr(form, "domain"),
    phone: optStr(form, "phone"),
    customFields: { ...((existing?.customFields as object) ?? {}), ...cf.data },
  };
  let recordId = id;
  if (existing) await db.company.update({ where: { id: existing.id }, data });
  else recordId = (await db.company.create({ data: { ...data, tenantId: tenant.id, createdById: user.id } })).id;
  redirect(`/companies/${recordId}`);
}

export async function deleteCompany(id: string) {
  const { db } = await requireMembership();
  await db.company.deleteMany({ where: { id } });
  redirect("/companies");
}
