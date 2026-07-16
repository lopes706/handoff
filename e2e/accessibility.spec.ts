import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
for (const [name, path] of [
  ["landing", "/"],
  ["setup dashboard", "/app/celo"],
  ["creation", "/app/stacks/new"],
  ["funded deal", "/d/celo/42?preview=funded-buyer"],
  ["receipt", "/d/stacks/42?preview=completed"],
])
  test(`${name} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.filter((item) =>
        ["serious", "critical"].includes(item.impact || ""),
      ),
    ).toEqual([]);
  });
