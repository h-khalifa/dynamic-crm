import { PrismaClient } from "@prisma/client";

/**
 * Raw, UNSCOPED Prisma client. Only platform-level code (auth, signup, tenant lookup,
 * templates, seed) may use it. CRM features must use `getTenantDb()` from lib/tenant-db.ts.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
