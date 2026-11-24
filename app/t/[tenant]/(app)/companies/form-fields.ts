import type { Company } from "@prisma/client";
import { customFormFields, type FormField } from "@/lib/crm/form-fields";
import type { AuthContext } from "@/lib/tenant";
import { getFieldConfig } from "@/lib/terms";

export async function companyFormFields(ctx: AuthContext, company?: Company | null) {
  const { system, custom } = await getFieldConfig(ctx.tenant.id, "COMPANY");
  const fields: FormField[] = [
    { name: "name", label: system.name, type: "TEXT", required: true, defaultValue: company?.name, wide: true },
    { name: "domain", label: system.domain, type: "URL", defaultValue: company?.domain },
    { name: "phone", label: system.phone, type: "PHONE", defaultValue: company?.phone },
  ];
  return { fields: [...fields, ...customFormFields(custom, company?.customFields)], customFrom: fields.length };
}
