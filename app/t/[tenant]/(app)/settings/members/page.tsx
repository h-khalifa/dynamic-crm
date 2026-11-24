import { ActionButton, ActionForm } from "@/components/crm/action-form";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { tenantUrl } from "@/lib/hosts";
import { requireMembership } from "@/lib/tenant";
import { formatDate } from "@/lib/utils";
import { changeRole, inviteMember, removeMember, revokeInvite } from "../actions";

export default async function MembersSettings() {
  const { tenant, db, membership: me } = await requireMembership("ADMIN");
  const [members, invites] = await Promise.all([
    db.membership.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
    db.invitation.findMany({ where: { acceptedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);
  const isOwner = me.role === "OWNER";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite a teammate</CardTitle>
          <CardDescription>
            {members.length + invites.length} of {tenant.plan.maxUsers} seats used on the {tenant.plan.name} plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={inviteMember} submitLabel="Send invite" resetOnSuccess inline>
            <Input name="email" type="email" placeholder="colleague@example.com" className="w-72" required />
            <Select name="role" defaultValue="MEMBER" className="w-36">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </ActionForm>
        </CardContent>
      </Card>

      <Table>
        <THead>
          <tr>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Role</TH>
            <TH>Joined</TH>
            <TH />
          </tr>
        </THead>
        <TBody>
          {members.map((m) => (
            <TR key={m.id}>
              <TD className="font-medium">
                {m.user.name} {m.id === me.id && <span className="text-xs text-muted-foreground">(you)</span>}
              </TD>
              <TD>{m.user.email}</TD>
              <TD>
                {isOwner && m.id !== me.id ? (
                  <div className="flex gap-1">
                    {(["OWNER", "ADMIN", "MEMBER"] as const).map((r) => (
                      <ActionButton
                        key={r}
                        size="sm"
                        variant={m.role === r ? "default" : "outline"}
                        disabled={m.role === r}
                        action={changeRole.bind(null, m.id, r)}
                      >
                        {r.toLowerCase()}
                      </ActionButton>
                    ))}
                  </div>
                ) : (
                  <Badge color={m.role === "OWNER" ? "violet" : m.role === "ADMIN" ? "blue" : "slate"}>{m.role.toLowerCase()}</Badge>
                )}
              </TD>
              <TD>{formatDate(m.createdAt)}</TD>
              <TD className="text-right">
                {m.id !== me.id && (m.role !== "OWNER" || isOwner) && (
                  <ActionButton size="sm" variant="ghost" className="text-destructive" action={removeMember.bind(null, m.id)} confirmText={`Remove ${m.user.name}?`}>
                    Remove
                  </ActionButton>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {invites.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <span className="font-medium">{i.email}</span> <Badge>{i.role.toLowerCase()}</Badge>
                    <div className="break-all font-mono text-xs text-muted-foreground">{tenantUrl(tenant.slug, `/invite/${i.token}`)}</div>
                    <div className="text-xs text-muted-foreground">Expires {formatDate(i.expiresAt)}</div>
                  </div>
                  <ActionButton size="sm" variant="outline" action={revokeInvite.bind(null, i.id)}>
                    Revoke
                  </ActionButton>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
