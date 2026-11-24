/** Host parsing shared by middleware (edge) and server code. Keep dependency-free. */

/** Request header set by middleware carrying the current tenant slug (never trusted from clients). */
export const TENANT_HEADER = "x-tenant-slug";

export const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "mail", "static", "assets", "blog", "docs", "help", "support", "status",
]);

export type HostInfo = { kind: "root" } | { kind: "tenant"; slug: string };

export function rootDomain(): string {
  return (process.env.ROOT_DOMAIN || "localhost:3000").toLowerCase();
}

export function parseHost(host: string | null | undefined, root = rootDomain()): HostInfo {
  const h = (host || "").toLowerCase().trim();
  if (!h || h === root || h === `www.${root}`) return { kind: "root" };
  const suffix = `.${root}`;
  if (h.endsWith(suffix)) {
    const sub = h.slice(0, -suffix.length);
    if (sub && !sub.includes(".") && !RESERVED_SLUGS.has(sub)) return { kind: "tenant", slug: sub };
  }
  return { kind: "root" };
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

export function protocol(): string {
  return process.env.APP_PROTOCOL || "http";
}

export function rootUrl(path = "/"): string {
  return `${protocol()}://${rootDomain()}${path}`;
}

export function tenantUrl(slug: string, path = "/"): string {
  return `${protocol()}://${slug}.${rootDomain()}${path}`;
}
