"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  ["/settings", "Workspace"],
  ["/settings/terminology", "Terminology"],
  ["/settings/fields", "Fields"],
  ["/settings/pipeline", "Pipeline"],
  ["/settings/members", "Members"],
] as const;

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b">
      {TABS.map(([href, label]) => {
        const active = href === "/settings" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm",
              active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
