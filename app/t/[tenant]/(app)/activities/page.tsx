import Link from "next/link";
import { ActivityComposer } from "@/components/crm/activity-composer";
import { PageHeader } from "@/components/crm/page-header";
import { Timeline } from "@/components/crm/timeline";
import { Card, CardContent } from "@/components/ui/card";
import { ACTIVITY_TYPES } from "@/lib/entities";
import { param, type SearchParams } from "@/lib/crm/list-query";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { cn, contactName } from "@/lib/utils";
import { createActivity } from "./actions";

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const type = param(sp, "type");
  const { tenant, db } = await requireMembership();
  const terms = await getTerms(tenant.id);
  const validType = type && (ACTIVITY_TYPES as readonly string[]).includes(type) ? (type as (typeof ACTIVITY_TYPES)[number]) : undefined;

  const [items, contacts, deals] = await Promise.all([
    db.activity.findMany({
      where: validType ? { type: validType } : {},
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: 100,
    }),
    db.contact.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" }, take: 500 }),
    db.deal.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title={terms.ACTIVITY.plural} icon={terms.ACTIVITY.icon} description="Latest 100 entries across your workspace" />
      <div className="mb-6">
        <ActivityComposer
          action={createActivity.bind(null, {})}
          singular={terms.ACTIVITY.singular}
          linkOptions={{
            contacts: contacts.map((c) => ({ value: c.id, label: contactName(c) })),
            deals: deals.map((d) => ({ value: d.id, label: d.title })),
            contactLabel: terms.CONTACT.singular,
            dealLabel: terms.DEAL.singular,
          }}
        />
      </div>
      <div className="mb-4 flex gap-1 text-sm">
        {[undefined, ...ACTIVITY_TYPES].map((t) => (
          <Link
            key={t ?? "all"}
            href={t ? `?type=${t}` : "?"}
            className={cn("rounded-full px-3 py-1", validType === t ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {t ? t.charAt(0) + t.slice(1).toLowerCase() : "All"}
          </Link>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Timeline items={items} showLinks />
        </CardContent>
      </Card>
    </div>
  );
}
