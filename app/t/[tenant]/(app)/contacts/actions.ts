"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { optStr, prefixErrors, str } from "@/lib/crm/form-fields";
import { readCustomFieldsFromForm, validateCustomFields } from "@/lib/fields/validate";
import { assertCanAddContacts, PlanLimitError } from "@/lib/plans";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig } from "@/lib/terms";
import type { ActionState } from "@/lib/utils";

const emailSchema = z.email();

export async function saveContact(id: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { tenant, user, db } = await requireMembership();
  const { custom, system } = await getFieldConfig(tenant.id, "CONTACT");
  const existing = id ? await db.contact.findFirst({ where: { id } }) : null;
  if (id && !existing) return { error: "Record not found." };

  const fieldErrors: Record<string, string> = {};
  const firstName = str(form, "firstName");
  if (!firstName) fieldErrors.firstName = `${system.firstName} is required`;
  const email = optStr(form, "email");
  if (email && !emailSchema.safeParse(email).success) fieldErrors.email = "Invalid email";
  const companyId = optStr(form, "companyId");
  if (companyId && !(await db.company.findFirst({ where: { id: companyId }, select: { id: true } }))) {
    fieldErrors.companyId = "Not found";
  }
  const cf = validateCustomFields(readCustomFieldsFromForm(form, custom), custom);
  Object.assign(fieldErrors, prefixErrors(cf.errors));
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const data = {
    firstName,
    lastName: str(form, "lastName"),
    email,
    phone: optStr(form, "phone"),
    companyId,
    // keep values of archived fields that aren't on the form
    customFields: { ...((existing?.customFields as object) ?? {}), ...cf.data },
  };

  let recordId = id;
  try {
    if (existing) {
      await db.contact.update({ where: { id: existing.id }, data });
    } else {
      assertCanAddContacts(tenant.plan, await db.contact.count());
      recordId = (await db.contact.create({ data: { ...data, tenantId: tenant.id, createdById: user.id } })).id;
    }
  } catch (e) {
    if (e instanceof PlanLimitError) return { error: e.message };
    throw e;
  }
  redirect(`/contacts/${recordId}`);
}

export async function deleteContact(id: string) {
  const { db } = await requireMembership();
  await db.contact.deleteMany({ where: { id } });
  redirect("/contacts");
}

export type ImportResult = { ok?: boolean; error?: string; imported?: number; skipped?: { row: number; reason: string }[] };

/** Bulk import from the CSV mapper. `rows` are already mapped to field keys client-side. */
export async function importContacts(rows: Record<string, string>[]): Promise<ImportResult> {
  const { tenant, user, db } = await requireMembership();
  if (!Array.isArray(rows) || rows.length === 0) return { error: "No rows to import." };
  if (rows.length > 5000) return { error: "Import at most 5,000 rows at a time." };
  const { custom } = await getFieldConfig(tenant.id, "CONTACT");

  const skipped: { row: number; reason: string }[] = [];
  const data: any[] = [];
  rows.forEach((r, i) => {
    const firstName = (r.firstName ?? "").trim();
    if (!firstName) return skipped.push({ row: i + 1, reason: "Missing first name" });
    const email = (r.email ?? "").trim() || null;
    if (email && !emailSchema.safeParse(email).success) return skipped.push({ row: i + 1, reason: "Invalid email" });
    const raw: Record<string, unknown> = {};
    for (const f of custom) {
      const v = r[`cf.${f.key}`];
      if (v === undefined) continue;
      raw[f.key] = f.type === "MULTISELECT" ? v.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : f.type === "BOOLEAN" ? /^(y|yes|true|1)$/i.test(v.trim()) : v.trim();
    }
    const cf = validateCustomFields(raw, custom);
    if (!cf.ok) return skipped.push({ row: i + 1, reason: Object.values(cf.errors)[0] });
    data.push({
      tenantId: tenant.id,
      firstName,
      lastName: (r.lastName ?? "").trim(),
      email,
      phone: (r.phone ?? "").trim() || null,
      customFields: cf.data,
      createdById: user.id,
    });
  });

  try {
    if (data.length) {
      assertCanAddContacts(tenant.plan, await db.contact.count(), data.length);
      await db.contact.createMany({ data });
    }
  } catch (e) {
    if (e instanceof PlanLimitError) return { error: e.message };
    throw e;
  }
  return { ok: true, imported: data.length, skipped };
}
