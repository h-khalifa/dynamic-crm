import type { Deal } from "@prisma/client";
import { customFormFields, type FormField } from "@/lib/crm/form-fields";
import { getDefaultPipeline } from "@/lib/crm/pipeline";
import type { AuthContext } from "@/lib/tenant";
import { getFieldConfig } from "@/lib/terms";
import { contactName } from "@/lib/utils";

export async function dealFormFields(ctx: AuthContext, deal?: Deal | null, prefill: { contactId?: string; companyId?: string } = {}) {
  const [{ system, custom }, pipeline, contacts, companies] = await Promise.all([
    getFieldConfig(ctx.tenant.id, "DEAL"),
    getDefaultPipeline(ctx.db, ctx.tenant.id),
    ctx.db.contact.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" }, take: 500 }),
    ctx.db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  const fields: FormField[] = [
    { name: "title", label: system.title, type: "TEXT", required: true, defaultValue: deal?.title, wide: true },
    {
      name: "stageId",
      label: system.stage,
      type: "RELATION",
      required: true,
      options: pipeline.stages.map((s) => ({ value: s.id, label: s.name })),
      defaultValue: deal?.stageId ?? pipeline.stages[0]?.id,
    },
    { name: "value", label: system.value, type: "CURRENCY", defaultValue: deal ? deal.value / 100 : null },
    {
      name: "contactId",
      label: system.contact,
      type: "RELATION",
      options: contacts.map((c) => ({ value: c.id, label: contactName(c) })),
      defaultValue: deal?.contactId ?? prefill.contactId,
    },
    {
      name: "companyId",
      label: system.company,
      type: "RELATION",
      options: companies.map((c) => ({ value: c.id, label: c.name })),
      defaultValue: deal?.companyId ?? prefill.companyId,
    },
  ];
  return { fields: [...fields, ...customFormFields(custom, deal?.customFields)], customFrom: fields.length };
}
