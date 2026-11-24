import { NextRequest, NextResponse } from "next/server";
import { parseHost, TENANT_HEADER } from "@/lib/hosts";

/**
 * Host-based routing:
 *   ROOT_DOMAIN           → marketing + auth routes as-is
 *   {slug}.ROOT_DOMAIN    → rewritten into app/t/[tenant]/...
 * The tenant slug is passed to server code via a request header that we always
 * overwrite, so clients cannot spoof it.
 */
export function middleware(req: NextRequest) {
  const info = parseHost(req.headers.get("host"));
  const headers = new Headers(req.headers);
  headers.delete(TENANT_HEADER);
  const url = req.nextUrl.clone();

  if (info.kind === "tenant") {
    headers.set(TENANT_HEADER, info.slug);
    if (!url.pathname.startsWith("/api/")) {
      url.pathname = `/t/${info.slug}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url, { request: { headers } });
    }
    return NextResponse.next({ request: { headers } });
  }

  // The internal /t/* tree is only reachable through a tenant subdomain.
  if (url.pathname === "/t" || url.pathname.startsWith("/t/")) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
