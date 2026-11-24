import type { Activity } from "@prisma/client";
import { Mail, MessageSquare, Phone, Users } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { DeleteIconButton } from "./delete-button";
import { deleteActivity } from "@/app/t/[tenant]/(app)/activities/actions";

const ICONS = { NOTE: MessageSquare, CALL: Phone, MEETING: Users, EMAIL: Mail };

export type TimelineItem = Activity & {
  contact?: { id: string; firstName: string; lastName: string } | null;
  company?: { id: string; name: string } | null;
  deal?: { id: string; title: string } | null;
};

export function Timeline({ items, showLinks = false }: { items: TimelineItem[]; showLinks?: boolean }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Nothing logged yet.</p>;
  return (
    <ol className="relative space-y-5 border-l pl-6">
      {items.map((a) => {
        const Icon = ICONS[a.type];
        return (
          <li key={a.id} className="group relative">
            <span className="absolute -left-[35px] grid size-6 place-items-center rounded-full border bg-background">
              <Icon className="size-3.5 text-primary" />
            </span>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{a.subject}</div>
                <div className="text-xs text-muted-foreground">
                  {a.type.toLowerCase()} · {formatDate(a.occurredAt)}
                  {showLinks && a.contact && (
                    <>
                      {" · "}
                      <Link className="hover:underline" href={`/contacts/${a.contact.id}`}>
                        {`${a.contact.firstName} ${a.contact.lastName}`.trim()}
                      </Link>
                    </>
                  )}
                  {showLinks && a.company && (
                    <>
                      {" · "}
                      <Link className="hover:underline" href={`/companies/${a.company.id}`}>
                        {a.company.name}
                      </Link>
                    </>
                  )}
                  {showLinks && a.deal && (
                    <>
                      {" · "}
                      <Link className="hover:underline" href={`/deals/${a.deal.id}`}>
                        {a.deal.title}
                      </Link>
                    </>
                  )}
                </div>
                {a.body && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>}
              </div>
              <DeleteIconButton action={deleteActivity.bind(null, a.id)} confirmText="Delete this entry?" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
