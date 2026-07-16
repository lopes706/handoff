import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ headless: true });
async function shot(name, path, viewport, action) {
  const page = await browser.newPage(
    viewport.width < 600
      ? { ...devices["Pixel 7"], viewport }
      : { viewport, deviceScaleFactor: 1 },
  );
  await page.goto(`http://127.0.0.1:3000${path}`);
  await page.waitForTimeout(1200);
  if (action) await action(page);
  await page.screenshot({
    path: `/tmp/handoff-${name}.png`,
    fullPage: !action,
  });
  await page.close();
}
await shot("landing-desktop", "/", { width: 1440, height: 1000 });
await shot("landing-mobile", "/", { width: 412, height: 915 });
await shot("setup-desktop", "/app/celo", { width: 1440, height: 1000 });
await shot("dashboard-desktop", "/app/celo?preview=1", {
  width: 1440,
  height: 1000,
});
await shot("create-mobile", "/app/stacks/new", { width: 412, height: 915 });
await shot("deal-desktop", "/d/celo/42?preview=funded-seller", {
  width: 1440,
  height: 1000,
});
await shot(
  "release-mobile",
  "/d/celo/42?preview=funded-buyer",
  { width: 412, height: 915 },
  async (page) => {
    await page
      .getByRole("button", { name: /Show one-time release pass/i })
      .click();
    await page.waitForTimeout(300);
  },
);
await shot(
  "scanner-desktop",
  "/d/stacks/42?preview=funded-seller",
  { width: 1440, height: 1000 },
  async (page) => {
    await page.getByRole("button", { name: /Scan release pass/i }).click();
    await page.waitForTimeout(500);
  },
);
await shot("refund-desktop", "/d/celo/42?preview=refunded", {
  width: 1440,
  height: 1000,
});
await shot("receipt-mobile", "/d/stacks/42?preview=completed", {
  width: 412,
  height: 915,
});
await shot("404-mobile", "/d/unknown/42", { width: 412, height: 915 });
await browser.close();
console.log("Saved 11 Handoff visual-inspection screenshots under /tmp.");
