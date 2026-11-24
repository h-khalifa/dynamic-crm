import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityComposer } from "@/components/crm/activity-composer";
import { DeleteButton } from "@/components/crm/delete-button";
import { FieldList } from "@/components/crm/field-list";
import { PageHeader } from "@/components/crm/page-header";
import { TaskList, TaskQuickAdd } from "@/components/crm/task-list";
import { Timeline } from "@/components/crm/timeline";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig, getTerms } from "@/lib/terms";
import { contactName, formatMoney } from "@/lib/utils";
import { createActivity } from "../../activities/actions";
import { createTask } from "../../tasks/actions";
import { deleteDeal } from "../actions";

export default async function DealDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenant, db } = await requireMembership();
  const deal = await db.deal.findFirst({
    where: { id },
    include: {
      stage: true,
      contact: true,
      company: true,
      activities: { orderBy: { occurredAt: "desc" } },
      tasks: { orderBy: [{ done: "asc" }, { dueAt: "asc" }] },
    },
  });
  if (!deal) notFound();
  const [terms, { system, custom }] = await Promise.all([getTerms(tenant.id), getFieldConfig(tenant.id, "DEAL")]);

  return (
    <>
      <PageHeader
        title={deal.title}
        icon={terms.DEAL.icon}
        description={
          <span className="flex items-center gap-2">
            {terms.DEAL.singular} · <Badge color={deal.stage.color}>{deal.stage.name}</Badge> · {formatMoney(deal.value)}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/deals/${deal.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <DeleteButton action={deleteDeal.bind(null, deal.id)} confirmText={`Delete "${deal.title}"?`} />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldList
                rows={[
                  { label: system.stage, value: deal.stage.name },
                  { label: system.value, value: formatMoney(deal.value) },
                  { label: system.contact, value: deal.contact && <Link className="text-primary hover:underline" href={`/contacts/${deal.contact.id}`}>{contactName(deal.contact)}</Link> },
                  { label: system.company, value: deal.company && <Link className="text-primary hover:underline" href={`/companies/${deal.company.id}`}>{deal.company.name}</Link> },
                ]}
                defs={custom}
                values={deal.customFields}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{terms.ACTIVITY.plural}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ActivityComposer
                action={createActivity.bind(null, { dealId: deal.id, contactId: deal.contactId, companyId: deal.companyId })}
                singular={terms.ACTIVITY.singular}
              />
              <Timeline items={deal.activities} />
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{terms.TASK.plural}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TaskQuickAdd action={createTask.bind(null, { dealId: deal.id })} placeholder={`New ${terms.TASK.singular.toLowerCase()}…`} />
            <TaskList tasks={deal.tasks.map((t) => ({ id: t.id, title: t.title, done: t.done, dueAt: t.dueAt?.toISOString() ?? null }))} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
