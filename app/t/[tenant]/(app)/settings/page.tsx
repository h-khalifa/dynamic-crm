import Link from "next/link";
import { ActionForm } from "@/components/crm/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { rootUrl, tenantUrl } from "@/lib/hosts";
import { formatPrice } from "@/lib/plans";
import { getTemplate } from "@/lib/templates";
import { requireMembership } from "@/lib/tenant";
import { formatDate } from "@/lib/utils";
import { updateWorkspace } from "./actions";

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function WorkspaceSettings() {
  const { tenant, db } = await requireMembership("ADMIN");
  const [contacts, users] = await Promise.all([db.contact.count(), db.membership.count()]);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Address: <span className="font-mono">{tenantUrl(tenant.slug, "")}</span> · Template: {getTemplate(tenant.template).name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={updateWorkspace}>
            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={tenant.name} required />
            </div>
          </ActionForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Plan & usage</CardTitle>
          <CardDescription>
            {tenant.plan.name} ({formatPrice(tenant.plan.priceMonthly)}
            {tenant.plan.priceMonthly ? "/mo" : ""})
            {tenant.trialEndsAt && <> · trial ends {formatDate(tenant.trialEndsAt)}</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Meter label="Records" used={contacts} max={tenant.plan.maxContacts} />
          <Meter label="Users" used={users} max={tenant.plan.maxUsers} />
          <Button asChild variant="outline">
            <Link href={rootUrl("/pricing")}>Compare plans</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Online billing is coming soon. Contact us to change plans.</p>
        </CardContent>
      </Card>
    </div>
  );
}
