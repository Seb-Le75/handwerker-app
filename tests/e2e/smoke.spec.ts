import { expect, test } from "@playwright/test";

async function signVisibleCanvas(page: import("@playwright/test").Page) {
  const canvas = page.locator("canvas:visible").last();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Signature canvas is not visible");
  await page.mouse.move(box.x + 35, box.y + box.height * 0.65);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35, { steps: 6 });
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.65, { steps: 6 });
  await page.mouse.up();
}

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
  await page.getByRole("link", { name: "Passwort vergessen?" }).click();
  await expect(page.getByRole("heading", { name: "Passwort zurücksetzen" })).toBeVisible();
  await expect(page.getByText("In der lokalen Vorschau ist kein E-Mail-Versand verbunden.")).toBeVisible();
  await page.getByRole("link", { name: "Zurück zur Anmeldung" }).click();

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

test("the iPad field workflow opens and edits the next scheduled job", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "hsa-payment-settings",
      JSON.stringify({ paypalEnabled: true, paypalMe: "handwerker-test", paypalDiscountPercent: 5 })
    );
  });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Heute anstehende Einsätze" })).toBeVisible();
  await expect(page.getByText("13:30").first()).toBeVisible();
  await page
    .getByRole("link", { name: /Auftrag öffnen/ })
    .first()
    .click();

  await expect(page.getByRole("heading", { name: /Auftragsprotokoll job-24002/ })).toBeVisible();
  await expect(page.getByText(/Termin: Heute, 13:30 Uhr/)).toBeVisible();
  await page.getByRole("link", { name: "Einsatz abschließen" }).click();
  await expect(page.getByText("Einsatz bearbeiten · Abnahme")).toBeVisible();
  await page.getByRole("checkbox", { name: /Kunde bestätigt die Abnahme/ }).check();
  await signVisibleCanvas(page);
  await page.getByRole("button", { name: "Weiter zur Übersicht" }).click();
  await expect(page.getByRole("heading", { name: "Einsatz bearbeiten · Übersicht" })).toBeVisible();
  await expect(page.getByRole("link", { name: /mit PayPal bezahlen/ })).toHaveAttribute(
    "href",
    /paypal\.me\/handwerker-test\//
  );
  await expect(page.getByRole("button", { name: "Auftrag abschließen" })).toBeEnabled();
  await page.getByRole("button", { name: "Auftrag abschließen" }).click();
  await expect(page.getByText("Vom Kunden bestätigt")).toBeVisible();

  await page.getByRole("link", { name: "Auftragsdaten bearbeiten" }).click();
  await expect(page.getByText("Einsatz bearbeiten · Termin & Auftrag")).toBeVisible();
  await expect(page.getByLabel("Einsatzdatum")).toHaveValue(/\d{4}-\d{2}-\d{2}/);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "einsatzfoto.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64"
      )
    });
  await expect(page.getByRole("img", { name: "einsatzfoto.png" })).toBeVisible();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByLabel("Material 1", { exact: true }).selectOption("mat-003");
  await page.getByLabel("Menge für Material 1").fill("3,15");
  await expect(page.getByLabel("Menge für Material 1")).toHaveValue("3,15");
  await expect(page.getByText("7,80 € / m")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("new job opens the complete legal and acceptance workflow", async ({ page }) => {
  await page.goto("/new");

  await expect(page.getByText("Schritt 1 von 8")).toBeVisible();
  await page.getByRole("button", { name: /K-1001.*Marlene Schneider/ }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await expect(page.getByText("Schritt 2 von 8")).toBeVisible();
  await page.getByRole("button", { name: "Reparatur" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();

  await expect(page.getByText("Schritt 3 von 8")).toBeVisible();
  await expect(page.getByRole("link", { name: /Datenschutzerklärung öffnen/ })).toBeVisible();
  await expect(page.getByText("Kunde bestätigt die Abnahme")).not.toBeVisible();
  await expect(page.getByText("Unterschrift Kunde")).toBeVisible();
});

test("maintenance and PayPal defaults are configurable", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Regelprüfungen / Wartungen" })).toBeVisible();
  const duration = page.getByLabel("Dauer für Sichtprüfung der Anlage");
  await duration.fill("25");
  await duration.blur();
  await page.getByRole("button", { name: "Material", exact: true }).first().click();
  await expect(page.getByLabel(/Material 1 für Sichtprüfung der Anlage/)).toBeVisible();

  await page.getByRole("checkbox", { name: "PayPal-Direktzahlung anbieten" }).check();
  await page.getByLabel("PayPal.Me-Name oder vollständiger Link").fill("mein-shk-betrieb");
  await page.getByLabel("PayPal-Sofortrabatt in Prozent").fill("4,5");
  await page.reload();

  await expect(page.getByLabel("Dauer für Sichtprüfung der Anlage")).toHaveValue("25");
  await expect(page.getByLabel("PayPal.Me-Name oder vollständiger Link")).toHaveValue("mein-shk-betrieb");
  await expect(page.getByLabel("PayPal-Sofortrabatt in Prozent")).toHaveValue("4,5");
});
