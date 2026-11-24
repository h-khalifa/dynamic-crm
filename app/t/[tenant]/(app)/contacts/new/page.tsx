import { EntityForm } from "@/components/crm/entity-form";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { saveContact } from "../actions";
import { contactFormFields } from "../form-fields";

export default async function NewContactPage() {
  const ctx = await requireMembership();
  const terms = await getTerms(ctx.tenant.id);
  const { fields, customFrom } = await contactFormFields(ctx);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`New ${terms.CONTACT.singular.toLowerCase()}`} icon={terms.CONTACT.icon} />
      <Card>
        <CardContent className="pt-5">
          <EntityForm
            action={saveContact.bind(null, null)}
            fields={fields}
            customFrom={customFrom}
            submitLabel={`Create ${terms.CONTACT.singular.toLowerCase()}`}
            cancelHref="/contacts"
          />
        </CardContent>
      </Card>
    </div>
  );
}
