import { redirect } from "next/navigation";
import { getCurrentMember, getCurrentTenant } from "@/lib/tenant";
import { TenantLoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function TenantLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const tenant = await getCurrentTenant();
  if (await getCurrentMember()) redirect("/contacts");
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <TenantLoginForm tenantName={tenant.name} linkError={error === "link"} />
    </div>
  );
}
