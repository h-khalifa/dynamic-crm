// Waits until the app container answers, so Playwright doesn't race its startup.
const url = `http://${process.env.E2E_TARGET_HOST ?? "web"}:3000/`;
for (let i = 0; i < 60; i++) {
  try {
    const res = await fetch(url, { headers: { host: "dcrm.test:3000" } });
    if (res.ok) process.exit(0);
  } catch {}
  await new Promise((r) => setTimeout(r, 1000));
}
console.error(`App at ${url} did not become ready`);
process.exit(1);
