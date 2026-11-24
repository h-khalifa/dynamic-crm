import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ListToolbar, Pagination } from "@/components/crm/list-toolbar";
import { EmptyState, PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { customFieldFilters, PAGE_SIZE, pageOf, param, type SearchParams } from "@/lib/crm/list-query";
import { formatFieldValue } from "@/lib/fields/validate";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig, getTerms } from "@/lib/terms";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { tenant, db } = await requireMembership();
  const [terms, { system, custom }] = await Promise.all([getTerms(tenant.id), getFieldConfig(tenant.id, "COMPANY")]);
  const t = terms.COMPANY;
  const q = param(sp, "q");
  const page = pageOf(sp);
  const { filters, jsonWhere, params } = customFieldFilters(custom, sp);
  const where: Prisma.CompanyWhereInput = {
    AND: [
      q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { domain: { contains: q, mode: "insensitive" } }] } : {},
      ...jsonWhere.map((j) => ({ customFields: j })),
    ],
  };
  const [rows, total] = await Promise.all([
    db.company.findMany({
      where,
      include: { _count: { select: { contacts: true, deals: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.company.count({ where }),
  ]);
  const listFields = custom.filter((f) => f.showInList).slice(0, 4);

  return (
    <>
      <PageHeader
        title={t.plural}
        icon={t.icon}
        actions={
          <Button asChild>
            <Link href="/companies/new">
              <Plus /> New {t.singular.toLowerCase()}
            </Link>
          </Button>
        }
      />
      {total === 0 && !q && jsonWhere.length === 0 ? (
        <EmptyState title={`No ${t.plural.toLowerCase()} yet`} text={`Create a ${t.singular.toLowerCase()} to group related ${terms.CONTACT.plural.toLowerCase()} and ${terms.DEAL.plural.toLowerCase()}.`} />
      ) : (
        <>
          <ListToolbar q={q} placeholder={`Search ${t.plural.toLowerCase()}…`} filters={filters} basePath="/companies" />
          <Table>
            <THead>
              <tr>
                <TH>{system.name}</TH>
                <TH>{system.domain}</TH>
                <TH>{terms.CONTACT.plural}</TH>
                <TH>{terms.DEAL.plural}</TH>
                {listFields.map((f) => (
                  <TH key={f.id}>{f.label}</TH>
                ))}
              </tr>
            </THead>
            <TBody>
              {rows.map((c) => {
                const cf = (c.customFields ?? {}) as Record<string, unknown>;
                return (
                  <TR key={c.id}>
                    <TD className="font-medium">
                      <Link href={`/companies/${c.id}`} className="hover:text-primary hover:underline">
                        {c.name}
                      </Link>
                    </TD>
                    <TD>{c.domain}</TD>
                    <TD>{c._count.contacts}</TD>
                    <TD>{c._count.deals}</TD>
                    {listFields.map((f) => (
                      <TD key={f.id}>{formatFieldValue(f, cf[f.key])}</TD>
                    ))}
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} params={{ q, ...params }} />
        </>
      )}
    </>
  );
}
