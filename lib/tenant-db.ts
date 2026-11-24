import { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultClient } from "./db";

/** Models that carry a tenantId column and must always be scoped. */
export const TENANT_MODELS = new Set<string>([
  "Membership",
  "Invitation",
  "EntityDefinition",
  "FieldDefinition",
  "Company",
  "Contact",
  "Pipeline",
  "Stage",
  "Deal",
  "Activity",
  "Task",
]);

type AnyArgs = Record<string, any>;

/** Pure function so the scoping rules can be unit-tested without a database. */
export function scopeArgs(operation: string, args: AnyArgs | undefined, tenantId: string): AnyArgs {
  const a: AnyArgs = { ...(args ?? {}) };
  switch (operation) {
    case "create":
      a.data = { ...a.data, tenantId };
      break;
    case "createMany":
    case "createManyAndReturn":
      a.data = Array.isArray(a.data)
        ? a.data.map((d: AnyArgs) => ({ ...d, tenantId }))
        : { ...a.data, tenantId };
      break;
    case "upsert":
      a.where = { ...a.where, tenantId };
      a.create = { ...a.create, tenantId };
      if (a.update && "tenantId" in a.update) delete a.update.tenantId;
      break;
    default:
      // findUnique(OrThrow), findFirst(OrThrow), findMany, count, aggregate, groupBy,
      // update, updateMany, delete, deleteMany
      a.where = { ...a.where, tenantId };
      if ((operation === "update" || operation === "updateMany") && a.data && "tenantId" in a.data) {
        a.data = { ...a.data };
        delete a.data.tenantId; // never allow moving a row to another tenant
      }
  }
  return a;
}

/**
 * Returns a Prisma client whose every query on a tenant model is forced into `tenantId`.
 * Always write foreign keys as scalars (contactId: "...") rather than nested `connect`
 * so the injected tenantId never mixes with relation-style input.
 */
export function getTenantDb(tenantId: string, client: PrismaClient = defaultClient) {
  if (!tenantId) throw new Error("getTenantDb: tenantId is required");
  return client.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);
          return query(scopeArgs(operation, args as AnyArgs, tenantId) as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof getTenantDb>;
export { Prisma };
