import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TENANT_HEADER, tenantUrl } from "@/lib/hosts";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifyToken } from "@/lib/session";

/** Exchanges a short-lived handoff token (from signup / root login) for a session on this subdomain. */
export async function GET(req: NextRequest) {
  const slug = req.headers.get(TENANT_HEADER);
  if (!slug) return new NextResponse("Not found", { status: 404 });

  const token = req.nextUrl.searchParams.get("token") ?? "";
  const claims = await verifyToken(token, "handoff");
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  const ok =
    claims &&
    tenant &&
    claims.tenant === slug &&
    (await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: tenant.id, userId: claims.userId } } }));

  if (!ok) return NextResponse.redirect(tenantUrl(slug, "/login?error=link"));

  const res = NextResponse.redirect(tenantUrl(slug, "/contacts"));
  res.cookies.set(SESSION_COOKIE, await signSession(claims.userId, slug), sessionCookieOptions());
  return res;
}
