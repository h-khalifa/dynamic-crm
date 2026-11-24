import { getCurrentTenant } from "@/lib/tenant";

export async function generateMetadata() {
  const tenant = await getCurrentTenant();
  return { title: { default: tenant.name, template: `%s · ${tenant.name}` } };
}

/** Resolves (or 404s) the tenant for every page under the subdomain. */
export default async function TenantRootLayout({ children }: { children: React.ReactNode }) {
  await getCurrentTenant();
  return children;
}
