import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidSlug } from "@/lib/hosts";

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") ?? "").toLowerCase();
  if (!isValidSlug(slug)) {
    return NextResponse.json({ available: false, reason: "Use 3–32 lowercase letters, numbers or dashes" });
  }
  const taken = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  return NextResponse.json(taken ? { available: false, reason: "Already taken" } : { available: true });
}
