import { expect, test } from "@playwright/test";

test("the existing dashboard loads", async ({ page }) => {
  const response = await page.goto("/");

  await expect(page.getByRole("heading", { name: "Handwerker Service App" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Neuer Auftrag" })).toBeVisible();
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
});

test("the local authentication and team preview are visible", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible();
  await expect(page.getByText("Lokale Entwicklungsvorschau")).toBeVisible();

  await page.getByRole("link", { name: /Vorschau öffnen/ }).click();
  await expect(page.getByRole("heading", { name: "Hansen Sanitär & Heizung GmbH" })).toBeVisible();
  await expect(page.getByText("Lokale Vorschau mit Beispieldaten")).toBeVisible();
  await expect(page.getByText("Mara Klein")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mitarbeiter einladen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Offene Einladungen" })).toBeVisible();
  await expect(page.getByText("lena.becker@beispiel.de")).toBeVisible();
  await expect(page.getByRole("button", { name: "Einladen" })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: "Aktiver Betrieb" })).toContainText("Nord Service GmbH");
  await expect(page.getByRole("button", { name: "Betrieb wechseln" })).toBeDisabled();

  await page.getByRole("link", { name: /Protokoll öffnen/ }).click();
  await expect(page.getByRole("heading", { name: "Audit-Protokoll" })).toBeVisible();
  await expect(page.getByText("Rolle geändert")).toBeVisible();
  await expect(page.getByText("Audit-Vorschau mit Beispieldaten")).toBeVisible();
});
