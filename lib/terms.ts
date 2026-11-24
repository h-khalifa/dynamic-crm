import "server-only";
import type { EntityKey, FieldDefinition } from "@prisma/client";
import { cache } from "react";
import { DEFAULT_TERMS, SYSTEM_FIELDS, type Terms } from "./entities";
import { getTenantDb } from "./tenant-db";

/** Tenant terminology (Contact → Patient …), merged over the defaults. Cached per request. */
export const getTerms = cache(async (tenantId: string): Promise<Terms> => {
  const defs = await getTenantDb(tenantId).entityDefinition.findMany();
  const terms: Terms = structuredClone(DEFAULT_TERMS);
  for (const d of defs) terms[d.entityKey] = { singular: d.singular, plural: d.plural, icon: d.icon };
  return terms;
});

export type FieldConfig = {
  /** Effective label for each built-in column. */
  system: Record<string, string>;
  /** Active custom fields in display order. */
  custom: FieldDefinition[];
};

export const getAllFieldDefs = cache(async (tenantId: string) =>
  getTenantDb(tenantId).fieldDefinition.findMany({ orderBy: [{ entityKey: "asc" }, { order: "asc" }] }),
);

export async function getFieldConfig(tenantId: string, entityKey: EntityKey): Promise<FieldConfig> {
  const defs = (await getAllFieldDefs(tenantId)).filter((d) => d.entityKey === entityKey);
  const system: Record<string, string> = {};
  for (const f of SYSTEM_FIELDS[entityKey]) system[f.key] = f.label;
  for (const d of defs) if (d.isSystem) system[d.key] = d.label;
  return { system, custom: defs.filter((d) => !d.isSystem && !d.archived) };
}
