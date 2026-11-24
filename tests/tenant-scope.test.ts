import { describe, expect, it } from "vitest";
import { scopeArgs } from "@/lib/tenant-db";

describe("scopeArgs", () => {
  const T = "tenant_a";
  it("adds tenantId to reads, updates and deletes", () => {
    for (const op of ["findMany", "findFirst", "findUnique", "count", "aggregate", "groupBy", "update", "updateMany", "delete", "deleteMany"]) {
      expect(scopeArgs(op, { where: { id: "1" } }, T).where).toEqual({ id: "1", tenantId: T });
    }
    expect(scopeArgs("findMany", undefined, T).where).toEqual({ tenantId: T });
  });
  it("overrides a tenantId supplied by the caller", () => {
    expect(scopeArgs("findMany", { where: { tenantId: "other" } }, T).where.tenantId).toBe(T);
    expect(scopeArgs("create", { data: { tenantId: "other", name: "x" } }, T).data.tenantId).toBe(T);
  });
  it("stamps tenantId on creates", () => {
    expect(scopeArgs("createMany", { data: [{ a: 1 }, { a: 2 }] }, T).data).toEqual([{ a: 1, tenantId: T }, { a: 2, tenantId: T }]);
    const u = scopeArgs("upsert", { where: { id: "1" }, create: { a: 1 }, update: { a: 2, tenantId: "other" } }, T);
    expect(u.where.tenantId).toBe(T);
    expect(u.create.tenantId).toBe(T);
    expect(u.update).not.toHaveProperty("tenantId");
  });
  it("never lets an update move a row to another tenant", () => {
    expect(scopeArgs("update", { where: { id: "1" }, data: { tenantId: "other", name: "x" } }, T).data).toEqual({ name: "x" });
  });
});
