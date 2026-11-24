import { EntityForm } from "@/components/crm/entity-form";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { param, type SearchParams } from "@/lib/crm/list-query";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { saveDeal } from "../actions";
import { dealFormFields } from "../form-fields";

export default async function NewDealPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const ctx = await requireMembership();
  const terms = await getTerms(ctx.tenant.id);
  const { fields, customFrom } = await dealFormFields(ctx, null, { contactId: param(sp, "contactId"), companyId: param(sp, "companyId") });
  return (
    <div className="max-w-3xl">
      <PageHeader title={`New ${terms.DEAL.singular.toLowerCase()}`} icon={terms.DEAL.icon} />
      <Card>
        <CardContent className="pt-5">
          <EntityForm
            action={saveDeal.bind(null, null)}
            fields={fields}
            customFrom={customFrom}
            submitLabel={`Create ${terms.DEAL.singular.toLowerCase()}`}
            cancelHref="/deals"
          />
        </CardContent>
      </Card>
    </div>
  );
}
