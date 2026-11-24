import { EntityForm } from "@/components/crm/entity-form";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { saveCompany } from "../actions";
import { companyFormFields } from "../form-fields";

export default async function NewCompanyPage() {
  const ctx = await requireMembership();
  const terms = await getTerms(ctx.tenant.id);
  const { fields, customFrom } = await companyFormFields(ctx);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`New ${terms.COMPANY.singular.toLowerCase()}`} icon={terms.COMPANY.icon} />
      <Card>
        <CardContent className="pt-5">
          <EntityForm
            action={saveCompany.bind(null, null)}
            fields={fields}
            customFrom={customFrom}
            submitLabel={`Create ${terms.COMPANY.singular.toLowerCase()}`}
            cancelHref="/companies"
          />
        </CardContent>
      </Card>
    </div>
  );
}
