/**
 * Integration tests against a real Postgres (TEST_DATABASE_URL, see docker-compose).
 * Run with: docker compose run --rm app npm run test:db
 */
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createWorkspace, SignupError } from "@/lib/signup";
import { getTenantDb } from "@/lib/tenant-db";

const url = process.env.TEST_DATABASE_URL;
const prisma = new PrismaClient({ datasourceUrl: url });
const run = url ? describe : describe.skip;

async function reset() {
  await prisma.$executeRawUnsafe(`TRUNCATE "Tenant", "User", "Plan" RESTART IDENTITY CASCADE`);
}

run("multi-tenant isolation", () => {
  let a: Awaited<ReturnType<typeof createWorkspace>>;
  let b: Awaited<ReturnType<typeof createWorkspace>>;

  beforeAll(async () => {
    await reset();
    const base = { password: "password123", plan: "trial" };
    a = await createWorkspace({ ...base, name: "A", email: "a@test.dev", companyName: "Clinic A", slug: "clinic-a", template: "clinic" }, prisma);
    b = await createWorkspace({ ...base, name: "B", email: "b@test.dev", companyName: "Realty B", slug: "realty-b", template: "real-estate" }, prisma);
  });
  afterAll(async () => {
    await reset();
    await prisma.$disconnect();
  });

  it("applies each tenant's template terminology and pipeline", async () => {
    const dbA = getTenantDb(a.tenant.id, prisma);
    const dbB = getTenantDb(b.tenant.id, prisma);
    expect((await dbA.entityDefinition.findFirst({ where: { entityKey: "CONTACT" } }))?.singular).toBe("Patient");
    expect((await dbB.entityDefinition.findFirst({ where: { entityKey: "CONTACT" } }))?.singular).toBe("Client");
    expect(await dbA.entityDefinition.count()).toBe(5);
    expect((await dbA.stage.findMany({ orderBy: { order: "asc" } })).map((s) => s.name)[0]).toBe("Booked");
  });

  it("never returns another tenant's records", async () => {
    const dbA = getTenantDb(a.tenant.id, prisma);
    const dbB = getTenantDb(b.tenant.id, prisma);
    const secret = await dbA.contact.create({ data: { tenantId: a.tenant.id, firstName: "Secret", customFields: {} } });

    expect(await dbB.contact.findMany()).toHaveLength(0);
    expect(await dbB.contact.findFirst({ where: { id: secret.id } })).toBeNull();
    expect(await dbB.contact.findUnique({ where: { id: secret.id } })).toBeNull();
    expect(await dbB.contact.count()).toBe(0);
    expect((await dbA.contact.findMany()).map((c) => c.id)).toEqual([secret.id]);
  });

  it("blocks cross-tenant writes", async () => {
    const dbA = getTenantDb(a.tenant.id, prisma);
    const dbB = getTenantDb(b.tenant.id, prisma);
    const rec = await dbA.contact.create({ data: { tenantId: a.tenant.id, firstName: "Keep" } });

    expect((await dbB.contact.updateMany({ where: { id: rec.id }, data: { firstName: "Hacked" } })).count).toBe(0);
    expect((await dbB.contact.deleteMany({ where: { id: rec.id } })).count).toBe(0);
    await expect(dbB.contact.update({ where: { id: rec.id }, data: { firstName: "Hacked" } })).rejects.toThrow();
    expect((await dbA.contact.findFirst({ where: { id: rec.id } }))?.firstName).toBe("Keep");

    // A create through B's client lands in B even if A's id is supplied.
    const forged = await dbB.contact.create({ data: { tenantId: a.tenant.id, firstName: "Forged" } });
    expect(forged.tenantId).toBe(b.tenant.id);
  });

  it("rejects duplicate slugs and wrong passwords for existing emails", async () => {
    const base = { password: "password123", plan: "trial", template: "generic", name: "X", companyName: "X" };
    await expect(createWorkspace({ ...base, email: "new@test.dev", slug: "clinic-a" }, prisma)).rejects.toBeInstanceOf(SignupError);
    await expect(createWorkspace({ ...base, email: "a@test.dev", slug: "another", password: "wrongpass1" }, prisma)).rejects.toBeInstanceOf(SignupError);
    // Same user, correct password → second workspace with one account.
    const second = await createWorkspace({ ...base, email: "a@test.dev", slug: "another" }, prisma);
    expect(second.user.id).toBe(a.user.id);
    expect(await prisma.membership.count({ where: { userId: a.user.id } })).toBe(2);
  });
});
