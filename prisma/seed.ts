/**
 * Demo data: two tenants with different vocabularies.
 *   http://clinic.localhost:3000  → owner@clinic.test  / password123
 *   http://realty.localhost:3000  → owner@realty.test  / password123
 *   demo@dynamiccrm.test / password123 is a member of both (shows the workspace picker on /login).
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { ensurePlans } from "../lib/plans";
import { createWorkspace } from "../lib/signup";
import { getTenantDb } from "../lib/tenant-db";

const prisma = new PrismaClient();
const PASSWORD = "password123";
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400_000);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

async function workspace(slug: string, companyName: string, template: string, email: string, name: string) {
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    console.log(`• ${slug} already exists, skipping`);
    return null;
  }
  const { tenant, user } = await createWorkspace(
    { slug, companyName, template, email, name, password: PASSWORD, plan: "starter" },
    prisma,
  );
  console.log(`✓ created ${slug} (${template})`);
  return { tenant, user, db: getTenantDb(tenant.id, prisma) };
}

async function stagesOf(db: ReturnType<typeof getTenantDb>) {
  return db.stage.findMany({ orderBy: { order: "asc" } });
}

async function seedClinic() {
  const ws = await workspace("clinic", "Sunrise Family Clinic", "clinic", "owner@clinic.test", "Dr. Rania Saleh");
  if (!ws) return;
  const { tenant, user, db } = ws;
  const t = tenant.id;
  const insurers = await Promise.all(
    ["MedCare Insurance", "HealthFirst", "Nile Assurance"].map((name) => db.company.create({ data: { tenantId: t, name, createdById: user.id } })),
  );
  const patients = [
    ["Sara", "Haddad", "1988-04-12", "Female", "O+", "INS-20931"],
    ["Omar", "Nasser", "1975-11-02", "Male", "A-", "INS-11872"],
    ["Lina", "Farouk", "1999-07-23", "Female", "B+", "INS-30455"],
    ["Karim", "Youssef", "1962-01-30", "Male", "AB+", "INS-44120"],
    ["Mona", "Ibrahim", "2004-09-15", "Female", "O-", "INS-50981"],
  ];
  const contacts = [];
  for (const [i, [firstName, lastName, dob, gender, bloodType, ins]] of patients.entries()) {
    contacts.push(
      await db.contact.create({
        data: {
          tenantId: t,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}@example.com`,
          phone: `+20 100 555 ${1000 + i}`,
          companyId: insurers[i % insurers.length].id,
          customFields: { dateOfBirth: dob, gender, bloodType, insuranceNumber: ins },
          createdById: user.id,
        },
      }),
    );
  }
  const stages = await stagesOf(db);
  const visits = [
    ["Annual check-up", 0, 2, "Check-up", "Dr. Saleh", 4000],
    ["Persistent cough", 1, 0, "Consultation", "Dr. Adel", 3000],
    ["Knee pain follow-up", 2, 1, "Consultation", "Dr. Saleh", 3000],
    ["Minor procedure", 3, 3, "Procedure", "Dr. Adel", 15000],
    ["Vaccination", 4, 1, "Check-up", "Dr. Saleh", 2000],
  ] as const;
  for (const [title, ci, si, visitType, doctor, fee] of visits) {
    await db.deal.create({
      data: {
        tenantId: t,
        title,
        value: fee, // cents
        stageId: stages[si].id,
        contactId: contacts[ci].id,
        ownerId: user.id,
        customFields: { appointmentDate: ymd(daysFromNow(si - 1)), visitType, doctor },
        createdById: user.id,
      },
    });
  }
  await db.activity.create({
    data: { tenantId: t, type: "NOTE", subject: "Initial consultation", body: "BP 120/80. Advised follow-up in 2 weeks.", contactId: contacts[0].id, createdById: user.id },
  });
  await db.task.create({ data: { tenantId: t, title: "Send lab results to Omar", dueAt: daysFromNow(1), contactId: contacts[1].id, assigneeId: user.id, createdById: user.id } });
  await db.task.create({ data: { tenantId: t, title: "Call MedCare about pre-approval", dueAt: daysFromNow(-1), companyId: insurers[0].id, assigneeId: user.id, createdById: user.id } });
}

async function seedRealty() {
  const ws = await workspace("realty", "Okafor Realty", "real-estate", "owner@realty.test", "Michael Okafor");
  if (!ws) return;
  const { tenant, user, db } = ws;
  const t = tenant.id;
  const clients = [
    ["Daniel", "Brooks", "Buy", 650000, "Downtown"],
    ["Maya", "Chen", "Rent", 2400, "Riverside"],
    ["Yusuf", "Kaya", "Sell", 1200000, "Hillcrest"],
    ["Elena", "Rossi", "Buy", 420000, "Old Town"],
  ] as const;
  const contacts = [];
  for (const [firstName, lastName, lookingTo, budget, preferredArea] of clients) {
    contacts.push(
      await db.contact.create({
        data: {
          tenantId: t,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          customFields: { lookingTo, budget, preferredArea },
          createdById: user.id,
        },
      }),
    );
  }
  const stages = await stagesOf(db);
  const deals = [
    ["2BR apartment, Harbor View", 0, 1, "Apartment", 2, 62000000],
    ["Family house, Maple St", 3, 2, "House", 4, 41500000],
    ["Hillcrest villa listing", 2, 3, "Villa", 5, 120000000],
    ["Studio rental, Riverside", 1, 0, "Apartment", 1, 240000],
  ] as const;
  for (const [title, ci, si, propertyType, bedrooms, price] of deals) {
    await db.deal.create({
      data: {
        tenantId: t,
        title,
        value: price,
        stageId: stages[si].id,
        contactId: contacts[ci].id,
        ownerId: user.id,
        customFields: { address: title.split(", ")[1] ?? title, propertyType, bedrooms },
        createdById: user.id,
      },
    });
  }
  await db.activity.create({
    data: { tenantId: t, type: "MEETING", subject: "Viewing at Harbor View", body: "Liked the balcony, concerned about parking.", contactId: contacts[0].id, createdById: user.id },
  });
}

async function seedSharedUser() {
  const email = "demo@dynamiccrm.test";
  if (await prisma.user.findUnique({ where: { email } })) return;
  const user = await prisma.user.create({ data: { email, name: "Demo User", passwordHash: await hashPassword(PASSWORD) } });
  for (const slug of ["clinic", "realty"]) {
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (tenant) await prisma.membership.create({ data: { tenantId: tenant.id, userId: user.id, role: "MEMBER" } });
  }
  console.log("✓ created demo@dynamiccrm.test (member of both)");
}

async function main() {
  await ensurePlans(prisma);
  await seedClinic();
  await seedRealty();
  await seedSharedUser();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
