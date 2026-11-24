import type { Contact } from "@prisma/client";
import { customFormFields, type FormField } from "@/lib/crm/form-fields";
import type { AuthContext } from "@/lib/tenant";
import { getFieldConfig } from "@/lib/terms";

export async function contactFormFields(ctx: AuthContext, contact?: Contact | null) {
  const { system, custom } = await getFieldConfig(ctx.tenant.id, "CONTACT");
  const companies = await ctx.db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 });
  const fields: FormField[] = [
    { name: "firstName", label: system.firstName, type: "TEXT", required: true, defaultValue: contact?.firstName },
    { name: "lastName", label: system.lastName, type: "TEXT", defaultValue: contact?.lastName },
    { name: "email", label: system.email, type: "EMAIL", defaultValue: contact?.email },
    { name: "phone", label: system.phone, type: "PHONE", defaultValue: contact?.phone },
    {
      name: "companyId",
      label: system.company,
      type: "RELATION",
      options: companies.map((c) => ({ value: c.id, label: c.name })),
      defaultValue: contact?.companyId,
    },
  ];
  return { fields: [...fields, ...customFormFields(custom, contact?.customFields)], customFrom: fields.length };
}
