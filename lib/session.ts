import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Sessions are host-only cookies: a login on clinic.example.com is not valid on
 * other.example.com. Moving from the marketing domain into a tenant uses a short-lived
 * signed "handoff" token exchanged at /auth/handoff on the tenant subdomain.
 */
export const SESSION_COOKIE = "dcrm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const HANDOFF_TTL_SECONDS = 120;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
}

export async function signSession(userId: string, tenantSlug: string) {
  return new SignJWT({ typ: "session", tenant: tenantSlug })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function signHandoff(userId: string, tenantSlug: string) {
  return new SignJWT({ typ: "handoff", tenant: tenantSlug })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${HANDOFF_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyToken(token: string, typ: "session" | "handoff") {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ !== typ || !payload.sub || typeof payload.tenant !== "string") return null;
    return { userId: payload.sub, tenant: payload.tenant };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.APP_PROTOCOL === "https",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
});

export async function setSessionCookie(userId: string, tenantSlug: string) {
  const token = await signSession(userId, tenantSlug);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Session for the current host's tenant, or null. */
export async function readSession(tenantSlug: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await verifyToken(token, "session");
  if (!s || s.tenant !== tenantSlug) return null;
  return s;
}
