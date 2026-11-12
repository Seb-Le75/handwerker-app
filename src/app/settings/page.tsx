"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockEmergencySurcharges, mockMaintenanceChecks, mockMaterials, mockTools } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { createId } from "@/lib/utils";
import type { EmergencySurcharge, MaintenanceCheckItem, MaterialCatalogItem, MaterialUnit, ToolCatalogItem } from "@/types";

const materialUnits: MaterialUnit[] = ["Stück", "Menge", "Länge"];

export default function SettingsPage() {
  const [materials, setMaterials] = useLocalStorage<MaterialCatalogItem[]>("hsa-materials", mockMaterials);
  const [tools, setTools] = useLocalStorage<ToolCatalogItem[]>("hsa-tools", mockTools);
  const [emergencySurcharges, setEmergencySurcharges] = useLocalStorage<EmergencySurcharge[]>(
    "hsa-emergency-surcharges",
    mockEmergencySurcharges
  );
  const [maintenanceChecks, setMaintenanceChecks] = useLocalStorage<MaintenanceCheckItem[]>(
    "hsa-maintenance-checks",
    mockMaintenanceChecks
  );
  const [focusMaterialId, setFocusMaterialId] = useState("");
  const [focusToolId, setFocusToolId] = useState("");
  const materialRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const toolRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
                <span className="mt-1 block text-muted-foreground">Standardprofil fuer Angebote, Wartung und Notdienst.</span>
              </div>
              <div className="rounded-lg bg-secondary/70 p-4">
                <span className="block font-semibold">Speicherung</span>
                <span className="mt-1 block text-muted-foreground">
                  Kunden, Auftraege und Materialpreise liegen im localStorage dieses Geraets.
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
              {["Datenschutzerklaerung", "Widerrufsbelehrung", "Auftragsbestaetigung", "Abnahmeprotokoll"].map((item) => (
                <div key={item} className="rounded-lg border bg-white p-4 font-medium shadow-sm">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <CardHeader>
              <CardTitle>Notdienst-Zulagen</CardTitle>
              <CardDescription>Aufschlaege fuer Notdienst-Auftraege</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {emergencySurcharges.map((surcharge) => (
                <div key={surcharge.id} className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[1fr_9rem]">
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
                    onChange={(event) => updateEmergencySurcharge(surcharge.id, { percent: Number(event.target.value) })}
                    placeholder="Prozent"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regelpruefungen / Wartungen</CardTitle>
              <CardDescription>Vorauswahl fuer Wartungsauftraege im Materialschritt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-white">
                <div className="grid grid-cols-[4rem_1fr] gap-3 border-b bg-secondary/70 px-4 py-3 text-sm font-semibold">
                  <span>Nr.</span>
                  <span>Bezeichnung</span>
                </div>
                {maintenanceChecks.map((check, index) => (
                  <div key={check.id} className="grid grid-cols-[4rem_1fr] gap-3 border-b px-4 py-3 last:border-b-0">
                    <span className="flex min-h-12 items-center text-sm font-medium text-muted-foreground">{index + 1}</span>
                    <Input
                      value={check.designation}
                      onChange={(event) => updateMaintenanceCheck(check.id, { designation: event.target.value })}
                      placeholder="Regelpruefung oder Wartung"
                    />
                  </div>
                ))}
              </div>
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
            <div className="overflow-x-auto">
              <div className="min-w-[760px] rounded-lg border bg-white">
                <div className="grid grid-cols-[4rem_1fr_10rem_12rem] gap-3 border-b bg-secondary/70 px-4 py-3 text-sm font-semibold">
                  <span>Nr.</span>
                  <span>Bezeichnung</span>
                  <span>Einheit</span>
                  <span>Preis</span>
                </div>
                <div className="grid">
                  {materials.map((material, index) => (
                    <div
                      key={material.id}
                      className="grid grid-cols-[4rem_1fr_10rem_12rem] gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <span className="flex min-h-12 items-center text-sm font-medium text-muted-foreground">{index + 1}</span>
                      <Input
                        ref={(element) => {
                          materialRefs.current[material.id] = element;
                        }}
                        value={material.designation}
                        onChange={(event) => updateMaterial(material.id, { designation: event.target.value })}
                        placeholder="Materialbezeichnung"
                      />
                      <select
                        className="min-h-12 rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={material.unit}
                        onChange={(event) => updateMaterial(material.id, { unit: event.target.value as MaterialUnit })}
                      >
                        {materialUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={material.unitPrice}
                        onChange={(event) => updateMaterial(material.id, { unitPrice: Number(event.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>Geraete und Werkzeug</CardTitle>
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
                    <div key={tool.id} className="grid grid-cols-[4rem_1fr_12rem] gap-3 border-b px-4 py-3 last:border-b-0">
                      <span className="flex min-h-12 items-center text-sm font-medium text-muted-foreground">{index + 1}</span>
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
