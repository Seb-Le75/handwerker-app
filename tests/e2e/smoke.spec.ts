import { expect, test } from "@playwright/test";

async function signVisibleCanvas(page: import("@playwright/test").Page) {
  const canvas = page.locator("canvas:visible").last();
  await canvas.scrollIntoViewIfNeeded();
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
  await expect(page.getByRole("navigation").getByRole("link", { name: "Auftrag erfassen" })).toBeVisible();
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

  await expect(page.getByRole("heading", { name: "Mein nächster Einsatz" })).toBeVisible();
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

test("the field and backoffice areas share the local job workflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Baustellenmodus · Mara Klein")).toBeVisible();
  await expect(page.getByRole("link", { name: "Navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Anfahrt starten" }).click();
  await expect(page.getByText("Unterwegs", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Büro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Büroübersicht" })).toBeVisible();
  await expect(page.getByText("Offene Aufträge")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Auftragssteuerung" })).toBeVisible();
  await page.getByRole("button", { name: /Prüfung/ }).click();
  await expect(page.getByRole("button", { name: "Büroprüfung abschließen" })).toBeVisible();
  await page.getByRole("button", { name: "Büroprüfung abschließen" }).click();
  await expect(page.getByText("In diesem Bereich gibt es keine Aufträge.")).toBeVisible();
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

  await expect(page.getByRole("heading", { name: "Firmendaten für Dokumente" })).toBeVisible();
  await page.getByLabel("Firmenname").fill("Hansen SHK Testbetrieb");
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

  await expect(page.getByLabel("Firmenname")).toHaveValue("Hansen SHK Testbetrieb");
  await expect(page.getByLabel("Dauer für Sichtprüfung der Anlage")).toHaveValue("25");
  await expect(page.getByLabel("PayPal.Me-Name oder vollständiger Link")).toHaveValue("mein-shk-betrieb");
  await expect(page.getByLabel("PayPal-Sofortrabatt in Prozent")).toHaveValue("4,5");
});

test("the backoffice creates, downloads, and converts commercial documents", async ({ page }) => {
  await page.goto("/documents");

  await expect(page.getByRole("heading", { name: "Dokumente", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dokumente" })).toBeVisible();
  await page
    .locator("div")
    .filter({ hasText: "Jahreswartung Gastherme inklusive Sichtprüfung und Funktionskontrolle." })
    .getByRole("link", { name: "Bestätigung" })
    .first()
    .click();

  await expect(page.getByRole("heading", { name: "Auftragsbestätigung erstellen" })).toBeVisible();
  await expect(page.getByLabel("Dokumentnummer")).toHaveValue(/AB-\d{4}-0001/);
  await page.getByRole("button", { name: "Dokument speichern" }).click();
  await expect(page.getByRole("heading", { name: /Auftragsbestätigung AB-\d{4}-0001/ })).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF herunterladen" }).click();
  await expect((await download).suggestedFilename()).toMatch(/^AB-\d{4}-0001-auftragsbestaetigung\.pdf$/);

  await page.getByRole("button", { name: "Rechnung erzeugen" }).click();
  await expect(page.getByRole("heading", { name: "Rechnung erstellen" })).toBeVisible();
  await expect(page.getByLabel("Dokumentnummer")).toHaveValue(/RE-\d{4}-0001/);
  await page.getByRole("button", { name: "Dokument speichern" }).click();
  await page.getByRole("button", { name: "Als bezahlt markieren" }).click();
  await expect(page.getByText("Bezahlt", { exact: true })).toBeVisible();
});

test("an accepted customer offer becomes a scheduled field job", async ({ page }) => {
  await page.goto("/documents");

  await page.getByLabel("Kunde").selectOption("cust-1001");
  await page.getByRole("link", { name: "Angebot erstellen" }).click();
  await expect(page.getByRole("heading", { name: "Angebot erstellen" })).toBeVisible();
  await page.getByLabel("Betreff").fill("Installation einer neuen Heizungsanlage");
  await page.getByLabel("Beschreibung").fill("Heizungsanlage liefern und montieren");
  await page.getByLabel("Einzelpreis Position 1").fill("4500");
  await page.getByRole("button", { name: "Dokument speichern" }).click();

  await page.getByRole("button", { name: "Als versendet markieren" }).click();
  await page.getByRole("button", { name: "Als angenommen markieren" }).click();
  await expect(page.getByRole("heading", { name: "Angenommenes Angebot als Auftrag einplanen" })).toBeVisible();
  const today = await page.evaluate(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  await page.getByLabel("Einsatzdatum").fill(today);
  await page.getByLabel("Startzeit").fill("10:15");
  await page.getByLabel("Mitarbeiter").selectOption("Mara Klein");
  await page.getByRole("button", { name: "Auftrag erstellen und einplanen" }).click();

  await expect(page.getByRole("heading", { name: /Auftragsprotokoll job-/ })).toBeVisible();
  await expect(page.getByText(/Termin:.*10:15 Uhr/)).toBeVisible();
  await expect(page.getByText("Heizungsanlage liefern und montieren")).toBeVisible();

  await page.goto("/planning");
  await expect(page.getByRole("heading", { name: "Wochenplanung" })).toBeVisible();
  await expect(page.getByText("Marlene Schneider")).toBeVisible();
  await page.getByText("Marlene Schneider").click();
  await expect(page.getByRole("heading", { name: "Planung bearbeiten" })).toBeVisible();
  await expect(page.getByLabel("Startzeit")).toHaveValue("10:15");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mein nächster Einsatz" })).toBeVisible();
  await expect(page.getByText("Installation einer neuen Heizungsanlage")).toBeVisible();
});
