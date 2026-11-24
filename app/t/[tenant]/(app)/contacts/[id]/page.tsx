import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityComposer } from "@/components/crm/activity-composer";
import { DeleteButton } from "@/components/crm/delete-button";
import { FieldList } from "@/components/crm/field-list";
import { PageHeader } from "@/components/crm/page-header";
import { TaskList, TaskQuickAdd } from "@/components/crm/task-list";
import { Timeline } from "@/components/crm/timeline";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig, getTerms } from "@/lib/terms";
import { contactName, formatMoney } from "@/lib/utils";
import { createActivity } from "../../activities/actions";
import { createTask } from "../../tasks/actions";
import { deleteContact } from "../actions";

export default async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenant, db } = await requireMembership();
  const contact = await db.contact.findFirst({
    where: { id },
    include: {
      company: true,
      deals: { include: { stage: true }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { occurredAt: "desc" } },
      tasks: { orderBy: [{ done: "asc" }, { dueAt: "asc" }] },
    },
  });
  if (!contact) notFound();
  const [terms, { system, custom }] = await Promise.all([getTerms(tenant.id), getFieldConfig(tenant.id, "CONTACT")]);
  const name = contactName(contact);

  return (
    <>
      <PageHeader
        title={name}
        icon={terms.CONTACT.icon}
        description={terms.CONTACT.singular}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/contacts/${contact.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <DeleteButton action={deleteContact.bind(null, contact.id)} confirmText={`Delete ${name}? Their activities and tasks will be deleted too.`} />
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
                  { label: system.email, value: contact.email && <a className="text-primary hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a> },
                  { label: system.phone, value: contact.phone },
                  {
                    label: system.company,
                    value: contact.company && (
                      <Link className="text-primary hover:underline" href={`/companies/${contact.company.id}`}>
                        {contact.company.name}
                      </Link>
                    ),
                  },
                ]}
                defs={custom}
                values={contact.customFields}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{terms.ACTIVITY.plural}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ActivityComposer action={createActivity.bind(null, { contactId: contact.id })} singular={terms.ACTIVITY.singular} />
              <Timeline items={contact.activities} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{terms.TASK.plural}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TaskQuickAdd action={createTask.bind(null, { contactId: contact.id })} placeholder={`New ${terms.TASK.singular.toLowerCase()}…`} />
              <TaskList
                tasks={contact.tasks.map((t) => ({ id: t.id, title: t.title, done: t.done, dueAt: t.dueAt?.toISOString() ?? null }))}
                empty={`No ${terms.TASK.plural.toLowerCase()}.`}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{terms.DEAL.plural}</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={`/deals/new?contactId=${contact.id}`}>Add</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {contact.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No {terms.DEAL.plural.toLowerCase()} yet.</p>
              ) : (
                <ul className="space-y-2">
                  {contact.deals.map((d) => (
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
        </div>
      </div>
    </>
  );
}
