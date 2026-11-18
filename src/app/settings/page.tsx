"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { DecimalInput } from "@/components/DecimalInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  mockCompanySettings,
  mockEmergencySurcharges,
  mockMaintenanceChecks,
  mockMaterials,
  mockPaymentSettings,
  mockTools
} from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { createId } from "@/lib/utils";
import { materialUnits, normalizeMaterialUnit } from "@/lib/materials";
import type {
  CompanySettings,
  EmergencySurcharge,
  MaintenanceCheckItem,
  MaterialCatalogItem,
  MaterialUnit,
  PaymentSettings,
  ToolCatalogItem
} from "@/types";

export default function SettingsPage() {
  const [materials, setMaterials, materialsHydrated] = useLocalStorage<MaterialCatalogItem[]>(
    "hsa-materials",
    mockMaterials
  );
  const [tools, setTools] = useLocalStorage<ToolCatalogItem[]>("hsa-tools", mockTools);
  const [emergencySurcharges, setEmergencySurcharges] = useLocalStorage<EmergencySurcharge[]>(
    "hsa-emergency-surcharges",
    mockEmergencySurcharges
  );
  const [maintenanceChecks, setMaintenanceChecks] = useLocalStorage<MaintenanceCheckItem[]>(
    "hsa-maintenance-checks",
    mockMaintenanceChecks
  );
  const [paymentSettings, setPaymentSettings] = useLocalStorage<PaymentSettings>(
    "hsa-payment-settings",
    mockPaymentSettings
  );
  const [companySettings, setCompanySettings] = useLocalStorage<CompanySettings>(
    "hsa-company-settings",
    mockCompanySettings
  );
  const [focusMaterialId, setFocusMaterialId] = useState("");
  const [focusToolId, setFocusToolId] = useState("");
  const materialRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const toolRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!materialsHydrated) return;
    const normalized = materials.map((material) => ({ ...material, unit: normalizeMaterialUnit(material.unit) }));
    if (normalized.some((material, index) => material.unit !== materials[index]?.unit)) setMaterials(normalized);
  }, [materials, materialsHydrated, setMaterials]);

  useEffect(() => {
    if (!focusMaterialId) {
      return;
    }
    const input = materialRefs.current[focusMaterialId];
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus();
    queueMicrotask(() => setFocusMaterialId(""));
  }, [focusMaterialId, materials.length]);

  useEffect(() => {
    if (!focusToolId) {
      return;
    }
    const input = toolRefs.current[focusToolId];
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus();
    queueMicrotask(() => setFocusToolId(""));
  }, [focusToolId, tools.length]);

  function updateMaterial(id: string, next: Partial<MaterialCatalogItem>) {
    setMaterials(materials.map((material) => (material.id === id ? { ...material, ...next } : material)));
  }

  function addMaterialRow() {
    const id = createId("mat");
    setMaterials([
      ...materials,
      {
        id,
        designation: "",
        unit: "Stück",
        unitPrice: 0
      }
    ]);
    setFocusMaterialId(id);
  }

  function updateTool(id: string, next: Partial<ToolCatalogItem>) {
    setTools(tools.map((tool) => (tool.id === id ? { ...tool, ...next } : tool)));
  }

  function addToolRow() {
    const id = createId("tool");
    setTools([
      ...tools,
      {
        id,
        designation: "",
        costRate: 0
      }
    ]);
    setFocusToolId(id);
  }

  function updateEmergencySurcharge(id: string, next: Partial<EmergencySurcharge>) {
    setEmergencySurcharges(
      emergencySurcharges.map((surcharge) => (surcharge.id === id ? { ...surcharge, ...next } : surcharge))
    );
  }

  function updateMaintenanceCheck(id: string, next: Partial<MaintenanceCheckItem>) {
    setMaintenanceChecks(maintenanceChecks.map((check) => (check.id === id ? { ...check, ...next } : check)));
  }

  function addMaintenanceCheck() {
    setMaintenanceChecks([
      ...maintenanceChecks,
      {
        id: createId("maintenance"),
        designation: "Neue Regelprüfung",
        durationMinutes: 30,
        flatRate: 0,
        travelFlatRate: 0,
        materials: []
      }
    ]);
  }

  function addMaintenanceMaterial(checkId: string) {
    const firstMaterial = materials.find((material) => material.designation.trim());
    if (!firstMaterial) return;
    setMaintenanceChecks(
      maintenanceChecks.map((check) =>
        check.id === checkId
          ? { ...check, materials: [...(check.materials ?? []), { materialId: firstMaterial.id, quantity: 1 }] }
          : check
      )
    );
  }

  function updateMaintenanceMaterial(
    checkId: string,
    index: number,
    next: Partial<{ materialId: string; quantity: number }>
  ) {
    setMaintenanceChecks(
      maintenanceChecks.map((check) =>
        check.id === checkId
          ? {
              ...check,
              materials: (check.materials ?? []).map((material, materialIndex) =>
                materialIndex === index ? { ...material, ...next } : material
              )
            }
          : check
      )
    );
  }

  function removeMaintenanceMaterial(checkId: string, index: number) {
    setMaintenanceChecks(
      maintenanceChecks.map((check) =>
        check.id === checkId
          ? { ...check, materials: (check.materials ?? []).filter((_, materialIndex) => materialIndex !== index) }
          : check
      )
    );
  }

  return (
    <AppShell>
      <div className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Betrieb</CardTitle>
              <CardDescription>Lokale MVP-Konfiguration</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="rounded-lg bg-secondary/70 p-4">
                <span className="block font-semibold">SHK Meisterbetrieb</span>
                <span className="mt-1 block text-muted-foreground">
                  Standardprofil für Angebote, Wartung und Notdienst.
                </span>
              </div>
              <div className="rounded-lg bg-secondary/70 p-4">
                <span className="block font-semibold">Speicherung</span>
                <span className="mt-1 block text-muted-foreground">
                  Kunden, Aufträge und Dokumente werden gemeinsam auf dem Mac mini gespeichert und auf der NAS
                  gesichert.
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dokumente</CardTitle>
              <CardDescription>Erfasste Pflichtbestandteile</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {[
                "Angebot",
                "Auftragsbestätigung",
                "Rechnung",
                "Datenschutzerklärung",
                "Widerrufsbelehrung",
                "Abnahmeprotokoll"
              ].map((item) => (
                <div key={item} className="rounded-lg border bg-white p-4 font-medium shadow-sm">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Firmendaten für Dokumente</CardTitle>
            <CardDescription>
              Diese Angaben erscheinen auf Angeboten, Auftragsbestätigungen und Rechnungen. Vor dem echten Einsatz bitte
              Steuer- und Bankdaten prüfen.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CompanyField
              id="company-name"
              label="Firmenname"
              value={companySettings.companyName}
              onChange={(companyName) => setCompanySettings({ ...companySettings, companyName })}
            />
            <CompanyField
              id="company-owner"
              label="Inhaber / Geschäftsführung"
              value={companySettings.ownerName}
              onChange={(ownerName) => setCompanySettings({ ...companySettings, ownerName })}
            />
            <CompanyField
              id="company-street"
              label="Straße und Hausnummer"
              value={companySettings.street}
              onChange={(street) => setCompanySettings({ ...companySettings, street })}
            />
            <CompanyField
              id="company-postal-code"
              label="Postleitzahl"
              value={companySettings.postalCode}
              onChange={(postalCode) => setCompanySettings({ ...companySettings, postalCode })}
            />
            <CompanyField
              id="company-city"
              label="Ort"
              value={companySettings.city}
              onChange={(city) => setCompanySettings({ ...companySettings, city })}
            />
            <CompanyField
              id="company-phone"
              label="Telefon"
              value={companySettings.phone}
              onChange={(phone) => setCompanySettings({ ...companySettings, phone })}
            />
            <CompanyField
              id="company-email"
              label="E-Mail"
              type="email"
              value={companySettings.email}
              onChange={(email) => setCompanySettings({ ...companySettings, email })}
            />
            <CompanyField
              id="company-tax-number"
              label="Steuernummer"
              value={companySettings.taxNumber}
              onChange={(taxNumber) => setCompanySettings({ ...companySettings, taxNumber })}
            />
            <CompanyField
              id="company-vat-id"
              label="USt-IdNr."
              value={companySettings.vatId}
              onChange={(vatId) => setCompanySettings({ ...companySettings, vatId })}
            />
            <CompanyField
              id="company-bank"
              label="Bank"
              value={companySettings.bankName}
              onChange={(bankName) => setCompanySettings({ ...companySettings, bankName })}
            />
            <CompanyField
              id="company-iban"
              label="IBAN"
              value={companySettings.iban}
              onChange={(iban) => setCompanySettings({ ...companySettings, iban })}
            />
            <CompanyField
              id="company-bic"
              label="BIC"
              value={companySettings.bic}
              onChange={(bic) => setCompanySettings({ ...companySettings, bic })}
            />
            <CompanyNumberField
              label="Standard-Umsatzsteuer"
              suffix="%"
              value={companySettings.defaultVatRate}
              onChange={(defaultVatRate) => setCompanySettings({ ...companySettings, defaultVatRate })}
            />
            <CompanyNumberField
              label="Angebotsgültigkeit"
              suffix="Tage"
              value={companySettings.offerValidityDays}
              onChange={(offerValidityDays) => setCompanySettings({ ...companySettings, offerValidityDays })}
            />
            <CompanyNumberField
              label="Zahlungsziel Rechnung"
              suffix="Tage"
              value={companySettings.invoicePaymentDays}
              onChange={(invoicePaymentDays) => setCompanySettings({ ...companySettings, invoicePaymentDays })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direktzahlung</CardTitle>
            <CardDescription>
              PayPal-Zahlung mit optionalem Sofortrabatt in der Abschlussübersicht anbieten
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border bg-white p-4">
              <Checkbox
                checked={paymentSettings.paypalEnabled}
                onCheckedChange={(checked) =>
                  setPaymentSettings({ ...paymentSettings, paypalEnabled: checked === true })
                }
              />
              PayPal-Direktzahlung anbieten
            </Label>
            <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
              <div className="space-y-2">
                <Label htmlFor="paypalMe">PayPal.Me-Name oder vollständiger Link</Label>
                <Input
                  id="paypalMe"
                  value={paymentSettings.paypalMe}
                  onChange={(event) => setPaymentSettings({ ...paymentSettings, paypalMe: event.target.value })}
                  placeholder="meinbetrieb oder https://paypal.me/meinbetrieb"
                />
              </div>
              <div className="space-y-2">
                <span className="block text-sm font-medium">Sofortrabatt in %</span>
                <DecimalInput
                  ariaLabel="PayPal-Sofortrabatt in Prozent"
                  value={paymentSettings.paypalDiscountPercent}
                  maximumFractionDigits={2}
                  onChange={(paypalDiscountPercent) =>
                    setPaymentSettings({ ...paymentSettings, paypalDiscountPercent })
                  }
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Die Vorschau öffnet PayPal.Me mit dem rabattierten Betrag. Eine automatische Zahlungsbestätigung ist erst
              mit einer serverseitigen PayPal-Anbindung möglich.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <CardHeader>
              <CardTitle>Notdienst-Zulagen</CardTitle>
              <CardDescription>Aufschläge für Notdienst-Aufträge</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {emergencySurcharges.map((surcharge) => (
                <div
                  key={surcharge.id}
                  className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[1fr_9rem]"
                >
                  <Input
                    value={surcharge.label}
                    onChange={(event) => updateEmergencySurcharge(surcharge.id, { label: event.target.value })}
                    placeholder="Bezeichnung"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={surcharge.percent}
                    onChange={(event) =>
                      updateEmergencySurcharge(surcharge.id, { percent: Number(event.target.value) })
                    }
                    placeholder="Prozent"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>Regelprüfungen / Wartungen</CardTitle>
                  <CardDescription>Dauer, Pauschalen und benötigte Materialien vorbelegen</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addMaintenanceCheck}>
                  <Plus className="h-4 w-4" /> Neue Regelprüfung
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {maintenanceChecks.map((check, index) => (
                <div key={check.id} className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`maintenance-name-${check.id}`}>
                      {index + 1}. Bezeichnung
                    </label>
                    <Input
                      id={`maintenance-name-${check.id}`}
                      value={check.designation}
                      onChange={(event) => updateMaintenanceCheck(check.id, { designation: event.target.value })}
                      placeholder="Regelprüfung oder Wartung"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <span className="block text-sm font-medium">Dauer in Minuten</span>
                      <DecimalInput
                        ariaLabel={`Dauer für ${check.designation}`}
                        value={check.durationMinutes ?? 0}
                        maximumFractionDigits={0}
                        onChange={(durationMinutes) => updateMaintenanceCheck(check.id, { durationMinutes })}
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-sm font-medium">Leistungspauschale €</span>
                      <DecimalInput
                        ariaLabel={`Leistungspauschale für ${check.designation}`}
                        value={check.flatRate ?? 0}
                        maximumFractionDigits={2}
                        onChange={(flatRate) => updateMaintenanceCheck(check.id, { flatRate })}
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-sm font-medium">Fahrtspauschale €</span>
                      <DecimalInput
                        ariaLabel={`Fahrtspauschale für ${check.designation}`}
                        value={check.travelFlatRate ?? 0}
                        maximumFractionDigits={2}
                        onChange={(travelFlatRate) => updateMaintenanceCheck(check.id, { travelFlatRate })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">Materialvorbelegung</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addMaintenanceMaterial(check.id)}
                      >
                        <Plus className="h-4 w-4" /> Material
                      </Button>
                    </div>
                    {(check.materials ?? []).map((materialDefault, materialIndex) => (
                      <div
                        key={`${check.id}-${materialIndex}`}
                        className="grid grid-cols-[minmax(0,1fr)_7rem_3rem] gap-2"
                      >
                        <select
                          aria-label={`Material ${materialIndex + 1} für ${check.designation}`}
                          className="min-h-12 min-w-0 rounded-md border border-input bg-background px-3 text-base shadow-sm"
                          value={materialDefault.materialId}
                          onChange={(event) =>
                            updateMaintenanceMaterial(check.id, materialIndex, { materialId: event.target.value })
                          }
                        >
                          {materials
                            .filter((material) => material.designation.trim())
                            .map((material) => (
                              <option key={material.id} value={material.id}>
                                {material.designation} ({material.unit})
                              </option>
                            ))}
                        </select>
                        <DecimalInput
                          ariaLabel={`Materialmenge ${materialIndex + 1} für ${check.designation}`}
                          value={materialDefault.quantity}
                          onChange={(quantity) => updateMaintenanceMaterial(check.id, materialIndex, { quantity })}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          aria-label="Materialvorbelegung entfernen"
                          onClick={() => removeMaintenanceMaterial(check.id, materialIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>Materialien</CardTitle>
                <CardDescription>Bezeichnung, Einheit und Stück- oder Meterpreis definieren</CardDescription>
              </div>
              <Button type="button" onClick={addMaterialRow}>
                <Plus className="h-5 w-5" />
                Neue Zeile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {materials.map((material, index) => (
                <div
                  key={material.id}
                  className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[3rem_1fr_9rem_12rem] md:items-end"
                >
                  <span className="text-sm font-medium text-muted-foreground md:pb-3">{index + 1}</span>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`material-name-${material.id}`}>
                      Bezeichnung
                    </label>
                    <Input
                      id={`material-name-${material.id}`}
                      ref={(element) => {
                        materialRefs.current[material.id] = element;
                      }}
                      value={material.designation}
                      onChange={(event) => updateMaterial(material.id, { designation: event.target.value })}
                      placeholder="Materialbezeichnung"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`material-unit-${material.id}`}>
                      Einheit
                    </label>
                    <select
                      id={`material-unit-${material.id}`}
                      className="min-h-12 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={material.unit}
                      onChange={(event) => updateMaterial(material.id, { unit: event.target.value as MaterialUnit })}
                    >
                      {materialUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-sm font-medium">Preis je Einheit</span>
                    <DecimalInput
                      ariaLabel={`Preis für Material ${index + 1}`}
                      value={material.unitPrice}
                      maximumFractionDigits={2}
                      onChange={(unitPrice) => updateMaterial(material.id, { unitPrice })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>Geräte und Werkzeug</CardTitle>
                <CardDescription>Anzahl im Auftrag, Bezeichnung und Kostensatz je Werkzeug definieren</CardDescription>
              </div>
              <Button type="button" onClick={addToolRow}>
                <Plus className="h-5 w-5" />
                Neue Zeile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[620px] rounded-lg border bg-white">
                <div className="grid grid-cols-[4rem_1fr_12rem] gap-3 border-b bg-secondary/70 px-4 py-3 text-sm font-semibold">
                  <span>Nr.</span>
                  <span>Bezeichnung</span>
                  <span>Kostensatz</span>
                </div>
                <div className="grid">
                  {tools.map((tool, index) => (
                    <div
                      key={tool.id}
                      className="grid grid-cols-[4rem_1fr_12rem] gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <span className="flex min-h-12 items-center text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <Input
                        ref={(element) => {
                          toolRefs.current[tool.id] = element;
                        }}
                        value={tool.designation}
                        onChange={(event) => updateTool(tool.id, { designation: event.target.value })}
                        placeholder="Werkzeugbezeichnung"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tool.costRate}
                        onChange={(event) => updateTool(tool.id, { costRate: Number(event.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function CompanyField({
  id,
  label,
  value,
  onChange,
  type = "text"
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email";
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function CompanyNumberField({
  label,
  suffix,
  value,
  onChange
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <DecimalInput ariaLabel={label} value={value} maximumFractionDigits={2} onChange={onChange} />
        <span className="text-sm text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}
