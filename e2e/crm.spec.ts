import { expect, test } from "@playwright/test";

const ROOT = "http://dcrm.test:3000";

test("signup as a clinic → patient → appointment → move on board → rename terminology", async ({ page }) => {
  const slug = `e2e${Date.now().toString(36)}`;
  const tenant = `http://${slug}.dcrm.test:3000`;

  // Marketing → signup
  await page.goto(`${ROOT}/pricing`);
  await page.getByRole("link", { name: "Choose Starter" }).click();
  await expect(page).toHaveURL(/\/signup\?plan=starter/);
  await page.getByRole("button", { name: /^Clinic/ }).click();
  await page.getByLabel("Your name").fill("E2E Tester");
  await page.getByLabel("Work email").fill(`${slug}@test.dev`);
  await page.getByLabel("Password").fill("password123");
  await page.getByLabel("Workspace name").fill("E2E Clinic");
  await page.getByLabel("Workspace address").fill(slug);
  await expect(page.getByText("Available")).toBeVisible();
  await page.getByRole("button", { name: "Create workspace" }).click();

  // Handoff lands on the tenant subdomain with clinic vocabulary
  await page.waitForURL(`${tenant}/contacts`);
  await expect(page.getByRole("heading", { name: "Patients" })).toBeVisible();
  const nav = page.locator("aside nav");
  await expect(nav.getByRole("link", { name: "Appointments" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Visit Notes" })).toBeVisible();

  // Create a patient with template custom fields
  await page.getByRole("link", { name: "New patient" }).click();
  await page.getByLabel("First name").fill("Nour");
  await page.getByLabel("Last name").fill("Adel");
  await page.getByLabel("Blood type").selectOption("O+");
  await page.getByLabel("Date of birth").fill("1990-05-04");
  await page.getByRole("button", { name: "Create patient" }).click();
  await expect(page.getByRole("heading", { name: "Nour Adel" })).toBeVisible();
  await expect(page.getByText("O+")).toBeVisible();

  // Log a visit note on the timeline
  await page.getByPlaceholder("Visit Note subject").fill("First visit");
  await page.getByRole("button", { name: "Log visit note" }).click();
  await expect(page.getByText("First visit")).toBeVisible();

  // Create an appointment (required custom field: Appointment date)
  await page.goto(`${tenant}/deals/new`);
  await page.getByLabel("Reason for visit").fill("Check-up visit");
  await page.getByLabel("Patient").selectOption({ label: "Nour Adel" });
  await page.getByLabel("Appointment date").fill("2026-12-01");
  await page.getByRole("button", { name: "Create appointment" }).click();
  await expect(page.getByRole("heading", { name: "Check-up visit" })).toBeVisible();

  // Drag it from "Booked" to "Confirmed" on the board
  await page.goto(`${tenant}/deals`);
  const card = page.locator("div.cursor-grab", { hasText: "Check-up visit" });
  const confirmed = page.locator("div.w-72", { has: page.getByText("Confirmed", { exact: true }) });
  const from = (await card.boundingBox())!;
  const to = (await confirmed.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height - 8);
  await page.mouse.down();
  await page.mouse.move(from.x + 40, from.y + 40, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 15 });
  await page.mouse.up();
  await expect(confirmed.getByText("Check-up visit")).toBeVisible();
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.locator("div.w-72", { has: page.getByText("Confirmed", { exact: true }) }).getByText("Check-up visit")).toBeVisible();

  // Rename the entity: Patient → Client, and the whole app follows
  await page.goto(`${tenant}/settings/terminology`);
  await page.locator('input[name="CONTACT.singular"]').fill("Client");
  await page.locator('input[name="CONTACT.plural"]').fill("Clients");
  await page.getByRole("button", { name: "Save terminology" }).click();
  await expect(page.getByText("Terminology updated")).toBeVisible();
  await page.goto(`${tenant}/contacts`);
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New client" })).toBeVisible();

  // Add a custom field and see it on the form
  await page.goto(`${tenant}/settings/fields?entity=CONTACT`);
  await page.getByLabel("Label", { exact: true }).last().fill("Preferred language");
  await page.getByRole("button", { name: "Add field" }).click();
  await expect(page.getByText("Field added")).toBeVisible();
  await page.goto(`${tenant}/contacts/new`);
  await expect(page.getByLabel("Preferred language")).toBeVisible();
});

test("root login with a multi-workspace account shows the picker", async ({ page }) => {
  await page.goto(`${ROOT}/login`);
  await page.getByLabel("Email").fill("demo@dynamiccrm.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Choose a workspace" })).toBeVisible();
  await page.getByRole("link", { name: /Okafor Realty/ }).click();
  await page.waitForURL("http://realty.dcrm.test:3000/contacts");
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
  await expect(page.locator("aside nav").getByRole("link", { name: "Property Deals" })).toBeVisible();

  // The realty session must not work on the clinic subdomain
  await page.goto("http://clinic.dcrm.test:3000/contacts");
  await expect(page).toHaveURL("http://clinic.dcrm.test:3000/login");
});
