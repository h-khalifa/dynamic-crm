import { NextRequest, NextResponse } from "next/server";
import { rootUrl } from "@/lib/hosts";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(_req: NextRequest) {
  const res = NextResponse.redirect(rootUrl("/"), { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
