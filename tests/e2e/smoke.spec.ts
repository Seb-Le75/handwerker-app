import { expect, test } from "@playwright/test";

test("the existing dashboard loads", async ({ page }) => {
  const response = await page.goto("/");

  await expect(page.getByRole("heading", { name: "Handwerker Service App" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Neuer Auftrag" })).toBeVisible();
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
});
