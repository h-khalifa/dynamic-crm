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
import { deleteCompany } from "../actions";

export default async function CompanyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenant, db } = await requireMembership();
  const company = await db.company.findFirst({
    where: { id },
    include: {
      contacts: { orderBy: { firstName: "asc" } },
      deals: { include: { stage: true }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { occurredAt: "desc" } },
      tasks: { orderBy: [{ done: "asc" }, { dueAt: "asc" }] },
    },
  });
  if (!company) notFound();
  const [terms, { system, custom }] = await Promise.all([getTerms(tenant.id), getFieldConfig(tenant.id, "COMPANY")]);
  const website = company.domain ? (company.domain.startsWith("http") ? company.domain : `https://${company.domain}`) : null;

  return (
    <>
      <PageHeader
        title={company.name}
        icon={terms.COMPANY.icon}
        description={terms.COMPANY.singular}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/companies/${company.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <DeleteButton action={deleteCompany.bind(null, company.id)} confirmText={`Delete ${company.name}? Linked records are kept but unlinked.`} />
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
                  { label: system.domain, value: website && <a className="text-primary hover:underline" href={website} target="_blank" rel="noreferrer">{company.domain}</a> },
                  { label: system.phone, value: company.phone },
                ]}
                defs={custom}
                values={company.customFields}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{terms.ACTIVITY.plural}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ActivityComposer action={createActivity.bind(null, { companyId: company.id })} singular={terms.ACTIVITY.singular} />
              <Timeline items={company.activities} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{terms.CONTACT.plural}</CardTitle>
            </CardHeader>
            <CardContent>
              {company.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">None linked.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {company.contacts.map((c) => (
                    <li key={c.id}>
                      <Link href={`/contacts/${c.id}`} className="hover:underline">
                        {contactName(c)}
                      </Link>
                      {c.email && <span className="text-muted-foreground"> · {c.email}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{terms.DEAL.plural}</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={`/deals/new?companyId=${company.id}`}>Add</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {company.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-2">
                  {company.deals.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link href={`/deals/${d.id}`} className="truncate hover:underline">
                        {d.title}
                      </Link>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-muted-foreground">{formatMoney(d.value)}</span>
                        <Badge color={d.stage.color}>{d.stage.name}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{terms.TASK.plural}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TaskQuickAdd action={createTask.bind(null, { companyId: company.id })} placeholder={`New ${terms.TASK.singular.toLowerCase()}…`} />
              <TaskList tasks={company.tasks.map((t) => ({ id: t.id, title: t.title, done: t.done, dueAt: t.dueAt?.toISOString() ?? null }))} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
