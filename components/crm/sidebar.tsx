"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { EntityIcon } from "./entity-icon";

type NavItem = { href: string; label: string; icon: string };

export function Sidebar({
  tenantName,
  nav,
  user,
  canSettings,
}: {
  tenantName: string;
  nav: NavItem[];
  user: { name: string; email: string; role: string };
  canSettings: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          {tenantName.charAt(0).toUpperCase()}
        </span>
        <span className="truncate font-semibold">{tenantName}</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground",
              isActive(n.href) && "bg-background font-medium text-foreground shadow-sm",
            )}
          >
            <EntityIcon name={n.icon} />
            {n.label}
          </Link>
        ))}
        {canSettings && (
          <Link
            href="/settings"
            className={cn(
              "mt-4 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground",
              isActive("/settings") && "bg-background font-medium text-foreground shadow-sm",
            )}
          >
            <Settings className="size-4" />
            Settings
          </Link>
        )}
      </nav>
      <div className="border-t p-3">
        <div className="truncate text-sm font-medium">{user.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {user.email} · {user.role.toLowerCase()}
        </div>
        <form action="/auth/logout" method="post" className="mt-2">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
            <LogOut className="size-3.5" /> Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
