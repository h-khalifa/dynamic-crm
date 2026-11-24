import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { PageHeader } from "@/components/crm/page-header";
import { TaskList, TaskQuickAdd } from "@/components/crm/task-list";
import { Card, CardContent } from "@/components/ui/card";
import { param, type SearchParams } from "@/lib/crm/list-query";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { cn, contactName } from "@/lib/utils";
import { createTask } from "./actions";

const FILTERS = [
  ["open", "Open"],
  ["mine", "Assigned to me"],
  ["overdue", "Overdue"],
  ["done", "Completed"],
] as const;

export default async function TasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filter = FILTERS.some(([k]) => k === param(sp, "filter")) ? param(sp, "filter")! : "open";
  const { tenant, db, user } = await requireMembership();
  const terms = await getTerms(tenant.id);

  const where: Prisma.TaskWhereInput =
    filter === "done"
      ? { done: true }
      : filter === "mine"
        ? { done: false, assigneeId: user.id }
        : filter === "overdue"
          ? { done: false, dueAt: { lt: new Date(new Date().toDateString()) } }
          : { done: false };

  const tasks = await db.task.findMany({
    where,
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
    },
    orderBy: filter === "done" ? { updatedAt: "desc" } : [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    take: 200,
  });
  // Names of assignees (members of this tenant only).
  const memberIds = [...new Set(tasks.map((t) => t.assigneeId).filter(Boolean))] as string[];
  const members = await db.membership.findMany({ where: { userId: { in: memberIds } }, select: { userId: true } });
  const users = await prisma.user.findMany({ where: { id: { in: members.map((m) => m.userId) } }, select: { id: true, name: true } });
  const nameOf = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="max-w-3xl">
      <PageHeader title={terms.TASK.plural} icon={terms.TASK.icon} />
      <div className="mb-4">
        <TaskQuickAdd action={createTask.bind(null, {})} placeholder={`New ${terms.TASK.singular.toLowerCase()}…`} />
      </div>
      <div className="mb-4 flex gap-1 text-sm">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={`?filter=${k}`} className={cn("rounded-full px-3 py-1", filter === k ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
            {label}
          </Link>
        ))}
      </div>
      <Card>
        <CardContent className="pt-3">
          <TaskList
            empty={`No ${terms.TASK.plural.toLowerCase()} here.`}
            tasks={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              done: t.done,
              dueAt: t.dueAt?.toISOString() ?? null,
              assignee: t.assigneeId ? nameOf.get(t.assigneeId) : null,
              link: t.contact
                ? { href: `/contacts/${t.contact.id}`, label: contactName(t.contact) }
                : t.deal
                  ? { href: `/deals/${t.deal.id}`, label: t.deal.title }
                  : t.company
                    ? { href: `/companies/${t.company.id}`, label: t.company.name }
                    : null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
