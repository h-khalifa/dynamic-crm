import { defineConfig } from "@playwright/test";

/**
 * E2E runs inside the Playwright Docker image (see docker-compose.e2e.yml).
 * The app under test uses ROOT_DOMAIN=dcrm.test:3000. Chromium maps that domain and all
 * of its subdomains to the `web` container, so tenant subdomain routing is exercised for real.
 */
const target = process.env.E2E_TARGET_HOST ?? "web";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://dcrm.test:3000",
    trace: "retain-on-failure",
    launchOptions: { args: [`--host-resolver-rules=MAP dcrm.test ${target}, MAP *.dcrm.test ${target}`] },
  },
});
