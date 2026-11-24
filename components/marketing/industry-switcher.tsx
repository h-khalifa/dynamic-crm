"use client";

import { useState } from "react";
import { EntityIcon } from "@/components/crm/entity-icon";
import { cn } from "@/lib/utils";

export type DemoIndustry = {
  key: string;
  name: string;
  nav: { label: string; icon: string }[];
  table: { title: string; columns: string[]; rows: string[][] };
};

/** Landing-page demo: the same CRM, relabelled live for each industry. */
export function IndustrySwitcher({ industries }: { industries: DemoIndustry[] }) {
  const [active, setActive] = useState(industries[0].key);
  const ind = industries.find((i) => i.key === active) ?? industries[0];

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {industries.map((i) => (
          <button
            key={i.key}
            onClick={() => setActive(i.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer",
              i.key === active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
            )}
          >
            {i.name}
          </button>
        ))}
      </div>
      <div className="mx-auto flex max-w-4xl overflow-hidden rounded-xl border bg-card text-left shadow-xl">
        <aside className="hidden w-48 shrink-0 border-r bg-muted/50 p-3 sm:block">
          <div className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">Workspace</div>
          {ind.nav.map((n, idx) => (
            <div
              key={n.label}
              className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-sm", idx === 0 && "bg-background font-medium shadow-sm")}
            >
              <EntityIcon name={n.icon} />
              {n.label}
            </div>
          ))}
        </aside>
        <div className="flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold">{ind.table.title}</h4>
            <span className="rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground">+ New</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  {ind.table.columns.map((c) => (
                    <th key={c} className="py-2 pr-4 font-medium whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ind.table.rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {r.map((cell, j) => (
                      <td key={j} className={cn("py-2 pr-4 whitespace-nowrap", j === 0 && "font-medium")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
