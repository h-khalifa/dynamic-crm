import Link from "next/link";
import { Sidebar } from "@/components/crm/sidebar";
import { ENTITY_KEYS, ENTITY_ROUTES } from "@/lib/entities";
import { hasRole, requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { tenant, membership, user } = await requireMembership();
  const terms = await getTerms(tenant.id);
  const nav = ENTITY_KEYS.map((k) => ({ href: `/${ENTITY_ROUTES[k]}`, label: terms[k].plural, icon: terms[k].icon }));

  const trialDaysLeft = tenant.trialEndsAt ? Math.ceil((tenant.trialEndsAt.getTime() - Date.now()) / 86400_000) : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        tenantName={tenant.name}
        nav={nav}
        user={{ name: user.name, email: user.email, role: membership.role }}
        canSettings={hasRole(membership.role, "ADMIN")}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {trialDaysLeft !== null && (
          <div className="border-b bg-accent px-6 py-1.5 text-center text-xs">
            {trialDaysLeft > 0 ? (
              <>
                {tenant.plan.name} plan trial: <strong>{trialDaysLeft} days</strong> left.
              </>
            ) : (
              <>Your trial has ended.</>
            )}{" "}
            {hasRole(membership.role, "ADMIN") && (
              <Link href="/settings" className="text-primary underline">
                Manage plan
              </Link>
            )}
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
