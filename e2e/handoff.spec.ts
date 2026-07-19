import { expect, test } from "@playwright/test";
test("landing explains the route and local preview", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Lock payment/i }),
  ).toBeVisible();
  await expect(page.getByText(/Local preview · not live/i)).toBeVisible();
  await page.getByRole("button", { name: /Lock payment/i }).click();
  await expect(page.locator(".status-tape")).toHaveText("funded");
});
test("default mainnet configuration never substitutes a live deals view", async ({ page }) => {
  await page.goto("/app/celo");
  await expect(
    page.getByRole("heading", { name: "Connect to inspect your deals" }),
  ).toBeVisible();
  await expect(page.getByText("LOCAL PREVIEW")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Contract setup required" })).toHaveCount(0);
});
test("dashboard preview is visibly local and cannot resemble a live wallet", async ({
  page,
}) => {
  await page.goto("/app/celo?preview=1");
  await expect(page.getByText("LOCAL PREVIEW")).toBeVisible();
  await expect(page.getByText("NO LIVE WALLET")).toBeVisible();
  await expect(page.getByText("Recent dispatches")).toBeVisible();
  await expect(page.locator('a[href*="preview=funded"]')).toBeVisible();
});
test("new-deal form exposes exact product controls", async ({ page }) => {
  await page.goto("/app/stacks/new");
  await expect(
    page.getByRole("heading", { name: "Create deal sheet" }),
  ).toBeVisible();
  await expect(page.getByLabel("Exact amount")).toBeVisible();
  await expect(page.getByRole("group", { name: "Expiry" })).toBeVisible();
  await expect(
    page.getByText(/private by sharing, not encrypted/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Create unlisted deal/i }),
  ).toBeEnabled();
});
test("labelled preview covers fund, buyer pass, seller claim, refund and receipt states", async ({
  page,
}) => {
  await page.goto("/d/celo/42?preview=open");
  await expect(page.getByText("LOCAL PREVIEW")).toBeVisible();
  await page
    .locator(".action-panel")
    .getByRole("button", { name: /Lock 18.5 USDT/i })
    .click();
  await expect(page.locator(".status-tape")).toHaveText("funded");
  await page.goto("/d/celo/42?preview=funded-buyer");
  await page
    .getByRole("button", { name: /Show one-time release pass/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /Show only after receiving/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Hide pass/i }).click();
  await page.goto("/d/stacks/42?preview=funded-seller");
  await page.getByLabel("Or paste pass JSON").fill("local preview pass");
  await page.getByRole("button", { name: /Validate pasted pass/i }).click();
  await expect(
    page.getByRole("button", { name: /Claim after handoff/i }),
  ).toBeVisible();
  await page.goto("/d/celo/42?preview=refunded");
  await expect(page.locator(".stamped")).toHaveText("REFUNDED");
});
test("deal metadata is noindex and invalid routes recover", async ({
  page,
}) => {
  await page.goto("/d/celo/42?preview=completed");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await page.goto("/d/unknown/42");
  await expect(
    page.getByRole("heading", { name: /could not be found/i }),
  ).toBeVisible();
});
test("mobile layout has no horizontal overflow and touch controls are large", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name !== "mobile")
    await page.setViewportSize({ width: 412, height: 915 });
  await page.goto("/d/celo/42?preview=funded-buyer");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  const box = await page.locator(".bottom-dock .button").boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
});
