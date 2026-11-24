import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export type ListFilter = { name: string; label: string; options: string[]; value?: string };

/** GET form: search box + dropdown filters for SELECT custom fields. State lives in the URL. */
export function ListToolbar({ q, placeholder, filters = [], basePath }: { q?: string; placeholder: string; filters?: ListFilter[]; basePath: string }) {
  const active = !!q || filters.some((f) => f.value);
  return (
    <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
      <Input name="q" defaultValue={q} placeholder={placeholder} className="w-64" />
      {filters.map((f) => (
        <Select key={f.name} name={f.name} defaultValue={f.value ?? ""} className="w-44">
          <option value="">{f.label}: any</option>
          {f.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      ))}
      <Button type="submit" variant="secondary">
        Apply
      </Button>
      {active && (
        <Button asChild variant="ghost">
          <Link href={basePath}>Clear</Link>
        </Button>
      )}
    </form>
  );
}

export function Pagination({ page, pageSize, total, params }: { page: number; pageSize: number; total: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total.toLocaleString()} record{total === 1 ? "" : "s"}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Link href={href(page - 1)}>Previous</Link>
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button asChild variant="outline" size="sm" className={page >= pages ? "pointer-events-none opacity-50" : ""}>
            <Link href={href(page + 1)}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
