import { PageHeader } from "@/components/crm/page-header";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig, getTerms } from "@/lib/terms";
import { importContacts } from "../actions";
import { CsvImporter } from "./csv-importer";

export default async function ImportContactsPage() {
  const { tenant } = await requireMembership();
  const [terms, { system, custom }] = await Promise.all([getTerms(tenant.id), getFieldConfig(tenant.id, "CONTACT")]);
  const targets = [
    { value: "firstName", label: system.firstName },
    { value: "lastName", label: system.lastName },
    { value: "email", label: system.email },
    { value: "phone", label: system.phone },
    ...custom.map((f) => ({ value: `cf.${f.key}`, label: f.label })),
  ];
  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`Import ${terms.CONTACT.plural.toLowerCase()}`}
        icon={terms.CONTACT.icon}
        description="Upload a CSV with a header row, then map its columns to your fields."
      />
      <CsvImporter targets={targets} onImport={importContacts} plural={terms.CONTACT.plural} />
    </div>
  );
}
