import { PageHeader } from "@/components/crm/page-header";
import { hasRole, requireMembership } from "@/lib/tenant";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { membership } = await requireMembership();
  if (!hasRole(membership.role, "ADMIN")) {
    return <p className="text-muted-foreground">Only workspace admins can change settings.</p>;
  }
  return (
    <div className="max-w-4xl">
      <PageHeader title="Settings" description="Shape the CRM around how your business works." />
      <SettingsTabs />
      {children}
    </div>
  );
}
