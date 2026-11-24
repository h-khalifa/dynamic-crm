import type { Prisma } from "@prisma/client";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { ListToolbar, Pagination } from "@/components/crm/list-toolbar";
import { EmptyState, PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { customFieldFilters, PAGE_SIZE, pageOf, param, type SearchParams } from "@/lib/crm/list-query";
import { formatFieldValue } from "@/lib/fields/validate";
import { requireMembership } from "@/lib/tenant";
import { getFieldConfig, getTerms } from "@/lib/terms";
import { contactName } from "@/lib/utils";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { tenant, db } = await requireMembership();
  const [terms, { system, custom }] = await Promise.all([getTerms(tenant.id), getFieldConfig(tenant.id, "CONTACT")]);
  const t = terms.CONTACT;

  const q = param(sp, "q");
  const page = pageOf(sp);
  const { filters, jsonWhere, params } = customFieldFilters(custom, sp);
  const where: Prisma.ContactWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {},
      ...jsonWhere.map((j) => ({ customFields: j })),
    ],
  };
  const [rows, total] = await Promise.all([
    db.contact.findMany({
      where,
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.contact.count({ where }),
  ]);
  const listFields = custom.filter((f) => f.showInList).slice(0, 4);
  const hasAny = total > 0 || q || jsonWhere.length > 0;

  return (
    <>
      <PageHeader
        title={t.plural}
        icon={t.icon}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/contacts/import">
                <Upload /> Import CSV
              </Link>
            </Button>
            <Button asChild>
              <Link href="/contacts/new">
                <Plus /> New {t.singular.toLowerCase()}
              </Link>
            </Button>
          </>
        }
      />
      {!hasAny ? (
        <EmptyState
          title={`No ${t.plural.toLowerCase()} yet`}
          text={`Add your first ${t.singular.toLowerCase()} or import a spreadsheet.`}
          action={
            <Button asChild>
              <Link href="/contacts/new">Add {t.singular.toLowerCase()}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ListToolbar q={q} placeholder={`Search ${t.plural.toLowerCase()}…`} filters={filters} basePath="/contacts" />
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>{system.email}</TH>
                <TH>{system.phone}</TH>
                <TH>{system.company}</TH>
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
                      <Link href={`/contacts/${c.id}`} className="hover:text-primary hover:underline">
                        {contactName(c)}
                      </Link>
                    </TD>
                    <TD>{c.email}</TD>
                    <TD>{c.phone}</TD>
                    <TD>
                      {c.company && (
                        <Link href={`/companies/${c.company.id}`} className="hover:underline">
                          {c.company.name}
                        </Link>
                      )}
                    </TD>
                    {listFields.map((f) => (
                      <TD key={f.id}>{formatFieldValue(f, cf[f.key])}</TD>
                    ))}
                  </TR>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <TD colSpan={4 + listFields.length} className="py-8 text-center text-muted-foreground">
                    No matches.
                  </TD>
                </tr>
              )}
            </TBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} params={{ q, ...params }} />
        </>
      )}
    </>
  );
}
