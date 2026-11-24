import { Columns3, List, Plus } from "lucide-react";
import Link from "next/link";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { EmptyState, PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { param, type SearchParams } from "@/lib/crm/list-query";
import { getDefaultPipeline } from "@/lib/crm/pipeline";
import { formatFieldValue } from "@/lib/fields/validate";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig, getTerms } from "@/lib/terms";
import { cn, contactName, formatMoney } from "@/lib/utils";
import { moveDeal } from "./actions";

export default async function DealsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const view = param(sp, "view") === "list" ? "list" : "board";
  const { tenant, db } = await requireMembership();
  const [terms, { system, custom }, pipeline] = await Promise.all([
    getTerms(tenant.id),
    getFieldConfig(tenant.id, "DEAL"),
    getDefaultPipeline(db, tenant.id),
  ]);
  const t = terms.DEAL;
  const deals = await db.deal.findMany({
    where: { stage: { pipelineId: pipeline.id } },
    include: { contact: true, company: true, stage: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    take: 1000,
  });
  // First custom field shown on cards (e.g. "Appointment date").
  const metaField = custom.find((f) => f.showInList);
  const total = deals.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <PageHeader
        title={t.plural}
        icon={t.icon}
        description={`${pipeline.name} · ${deals.length} open · ${formatMoney(total)}`}
        actions={
          <>
            <div className="flex rounded-md border p-0.5">
              {(
                [
                  ["board", Columns3, "Board"],
                  ["list", List, "List"],
                ] as const
              ).map(([v, Icon, label]) => (
                <Link
                  key={v}
                  href={v === "list" ? "?view=list" : "?"}
                  className={cn("flex items-center gap-1.5 rounded px-2.5 py-1 text-sm", view === v ? "bg-accent font-medium" : "text-muted-foreground")}
                >
                  <Icon className="size-4" /> {label}
                </Link>
              ))}
            </div>
            <Button asChild>
              <Link href="/deals/new">
                <Plus /> New {t.singular.toLowerCase()}
              </Link>
            </Button>
          </>
        }
      />
      {deals.length === 0 && view === "list" ? (
        <EmptyState title={`No ${t.plural.toLowerCase()} yet`} text={`Create your first ${t.singular.toLowerCase()} to start tracking it through the pipeline.`} />
      ) : view === "board" ? (
        <KanbanBoard
          stages={pipeline.stages.map((s) => ({ id: s.id, name: s.name, color: s.color, probability: s.probability }))}
          cards={deals.map((d) => ({
            id: d.id,
            title: d.title,
            value: d.value,
            stageId: d.stageId,
            subtitle: [d.contact && contactName(d.contact), d.company?.name].filter(Boolean).join(" · "),
            meta: metaField ? formatFieldValue(metaField, (d.customFields as Record<string, unknown>)[metaField.key]) : undefined,
          }))}
          onMove={moveDeal}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>{system.title}</TH>
              <TH>{system.stage}</TH>
              <TH>{system.value}</TH>
              <TH>{system.contact}</TH>
              <TH>{system.company}</TH>
              {custom
                .filter((f) => f.showInList)
                .slice(0, 3)
                .map((f) => (
                  <TH key={f.id}>{f.label}</TH>
                ))}
            </tr>
          </THead>
          <TBody>
            {deals.map((d) => (
              <TR key={d.id}>
                <TD className="font-medium">
                  <Link href={`/deals/${d.id}`} className="hover:text-primary hover:underline">
                    {d.title}
                  </Link>
                </TD>
                <TD>
                  <Badge color={d.stage.color}>{d.stage.name}</Badge>
                </TD>
                <TD>{formatMoney(d.value)}</TD>
                <TD>{d.contact && <Link href={`/contacts/${d.contact.id}`} className="hover:underline">{contactName(d.contact)}</Link>}</TD>
                <TD>{d.company && <Link href={`/companies/${d.company.id}`} className="hover:underline">{d.company.name}</Link>}</TD>
                {custom
                  .filter((f) => f.showInList)
                  .slice(0, 3)
                  .map((f) => (
                    <TD key={f.id}>{formatFieldValue(f, (d.customFields as Record<string, unknown>)[f.key])}</TD>
                  ))}
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
