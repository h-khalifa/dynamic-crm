import { notFound } from "next/navigation";
import { EntityForm } from "@/components/crm/entity-form";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { saveCompany } from "../../actions";
import { companyFormFields } from "../../form-fields";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireMembership();
  const company = await ctx.db.company.findFirst({ where: { id } });
  if (!company) notFound();
  const terms = await getTerms(ctx.tenant.id);
  const { fields, customFrom } = await companyFormFields(ctx, company);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${company.name}`} icon={terms.COMPANY.icon} />
      <Card>
        <CardContent className="pt-5">
          <EntityForm
            action={saveCompany.bind(null, company.id)}
            fields={fields}
            customFrom={customFrom}
            submitLabel="Save changes"
            cancelHref={`/companies/${company.id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
