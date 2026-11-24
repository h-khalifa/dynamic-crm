import { notFound } from "next/navigation";
import { EntityForm } from "@/components/crm/entity-form";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { saveDeal } from "../../actions";
import { dealFormFields } from "../../form-fields";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireMembership();
  const deal = await ctx.db.deal.findFirst({ where: { id } });
  if (!deal) notFound();
  const terms = await getTerms(ctx.tenant.id);
  const { fields, customFrom } = await dealFormFields(ctx, deal);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${deal.title}`} icon={terms.DEAL.icon} />
      <Card>
        <CardContent className="pt-5">
          <EntityForm action={saveDeal.bind(null, deal.id)} fields={fields} customFrom={customFrom} submitLabel="Save changes" cancelHref={`/deals/${deal.id}`} />
        </CardContent>
      </Card>
    </div>
  );
}
