import type { TenantDb } from "../tenant-db";

export type RecordLinks = { contactId?: string | null; companyId?: string | null; dealId?: string | null };

/** Ensures linked record ids belong to the current tenant (the scoped client returns null otherwise). */
export async function verifyLinks(db: TenantDb, links: RecordLinks): Promise<RecordLinks | null> {
  const out: RecordLinks = {};
  if (links.contactId) {
    if (!(await db.contact.findFirst({ where: { id: links.contactId }, select: { id: true } }))) return null;
    out.contactId = links.contactId;
  }
  if (links.companyId) {
    if (!(await db.company.findFirst({ where: { id: links.companyId }, select: { id: true } }))) return null;
    out.companyId = links.companyId;
  }
  if (links.dealId) {
    if (!(await db.deal.findFirst({ where: { id: links.dealId }, select: { id: true } }))) return null;
    out.dealId = links.dealId;
  }
  return out;
}
