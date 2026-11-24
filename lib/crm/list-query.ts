import type { FieldDefinition, Prisma } from "@prisma/client";
import type { ListFilter } from "@/components/crm/list-toolbar";

export const PAGE_SIZE = 25;

export type SearchParams = Record<string, string | string[] | undefined>;

export function param(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) || undefined;
}

export function pageOf(sp: SearchParams) {
  const p = Number(param(sp, "page") ?? 1);
  return Number.isInteger(p) && p > 0 ? p : 1;
}

/** Dropdown filters for SELECT custom fields (query param `f.<key>`), plus the matching JSON where clauses. */
export function customFieldFilters(defs: FieldDefinition[], sp: SearchParams) {
  const selects = defs.filter((d) => d.type === "SELECT" || d.type === "BOOLEAN");
  const filters: ListFilter[] = selects.map((d) => ({
    name: `f.${d.key}`,
    label: d.label,
    options: d.type === "BOOLEAN" ? ["Yes", "No"] : (Array.isArray(d.options) ? d.options : []).map(String),
    value: param(sp, `f.${d.key}`),
  }));
  const where: Prisma.JsonFilter[] = [];
  for (const d of selects) {
    const v = param(sp, `f.${d.key}`);
    if (!v) continue;
    where.push({ path: [d.key], equals: d.type === "BOOLEAN" ? v === "Yes" : v });
  }
  const params: Record<string, string | undefined> = Object.fromEntries(filters.map((f) => [f.name, f.value]));
  return { filters, jsonWhere: where, params };
}
