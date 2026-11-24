import type { FieldDefinition } from "@prisma/client";
import { formatFieldValue } from "@/lib/fields/validate";

export type DisplayRow = { label: string; value: React.ReactNode };

/** Definition list of system rows + tenant custom fields for a record detail page. */
export function FieldList({ rows, defs, values }: { rows: DisplayRow[]; defs: FieldDefinition[]; values: unknown }) {
  const v = (values && typeof values === "object" ? values : {}) as Record<string, unknown>;
  const all: DisplayRow[] = [...rows, ...defs.map((d) => ({ label: d.label, value: formatFieldValue(d, v[d.key]) }))];
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {all.map((r) => (
        <div key={r.label}>
          <dt className="text-xs text-muted-foreground">{r.label}</dt>
          <dd className="mt-0.5 break-words">{r.value || <span className="text-muted-foreground">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
