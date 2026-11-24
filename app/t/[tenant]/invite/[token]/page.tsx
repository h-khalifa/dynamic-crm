import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { AcceptInviteForm } from "./accept-form";

export const metadata = { title: "Join workspace" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const tenant = await getCurrentTenant();
  const { token } = await params;
  const invite = await prisma.invitation.findUnique({ where: { token } });
  const valid = invite && invite.tenantId === tenant.id && !invite.acceptedAt && invite.expiresAt > new Date();
  const existingUser = valid ? await prisma.user.findUnique({ where: { email: invite!.email }, select: { id: true } }) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      {valid ? (
        <AcceptInviteForm token={token} email={invite!.email} tenantName={tenant.name} hasAccount={!!existingUser} />
      ) : (
        <p className="text-muted-foreground">This invitation is invalid or has expired.</p>
      )}
    </div>
  );
}
