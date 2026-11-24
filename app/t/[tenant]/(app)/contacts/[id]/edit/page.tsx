import { notFound } from "next/navigation";
import { EntityForm } from "@/components/crm/entity-form";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { contactName } from "@/lib/utils";
import { saveContact } from "../../actions";
import { contactFormFields } from "../../form-fields";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireMembership();
  const contact = await ctx.db.contact.findFirst({ where: { id } });
  if (!contact) notFound();
  const terms = await getTerms(ctx.tenant.id);
  const { fields, customFrom } = await contactFormFields(ctx, contact);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${contactName(contact)}`} icon={terms.CONTACT.icon} />
      <Card>
        <CardContent className="pt-5">
          <EntityForm
            action={saveContact.bind(null, contact.id)}
            fields={fields}
            customFrom={customFrom}
            submitLabel="Save changes"
            cancelHref={`/contacts/${contact.id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
