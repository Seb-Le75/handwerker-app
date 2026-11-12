"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, OctagonX, Plus, Save, SkipForward } from "lucide-react";

import { AcceptanceStep } from "@/components/AcceptanceStep";
import { CustomerForm } from "@/components/CustomerForm";
import { LegalStep } from "@/components/LegalStep";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ProgressStepper } from "@/components/ProgressStepper";
import { SummaryStep } from "@/components/SummaryStep";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  jobTypes,
  mockCustomers,
  mockEmergencySurcharges,
  mockJobs,
  mockMaintenanceChecks,
  mockMaterials,
  mockTools
} from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { createId, formatCustomerName, formatAddress } from "@/lib/utils";
import type {
  CostCategory,
  Customer,
  Job,
  JobDraft,
  JobMaterialLine,
  JobToolLine,
  JobType,
  MaintenanceCheckItem,
  MaterialCatalogItem,
  TechnicianRole,
  ToolCatalogItem
} from "@/types";

const steps = [
  "Kunde",
  "Einsatzart",
  "Rechtliches",
  "Auftragsdetails",
  "Arbeitszeiten",
  "Material",
  "Abnahme",
  "Uebersicht"
];
const requiredSteps = new Set([0, 1, 2]);
const technicianRoles: TechnicianRole[] = ["Lehrling", "Geselle", "Meister"];
const costCategories: Array<{ value: CostCategory; label: string; amount?: string }> = [
  { value: "1", label: "Kategorie 1", amount: "15 EUR" },
  { value: "2", label: "Kategorie 2", amount: "25 EUR" },
  { value: "3", label: "Kategorie 3", amount: "35 EUR" }
];

const initialDraft: JobDraft = {
  customerId: "",
  type: "Reparatur",
  description: "",
  notes: "",
  startTime: "",
  endTime: "",
  technicianCount: 1,
  technicianRoles: ["Geselle"],
  travelCostCategory: undefined,
  vehicleSetupCostCategory: undefined,
  emergencySurchargePercent: undefined,
  maintenanceChecks: [],
  materials: [
    {
      id: "material-line-1",
      quantity: 1,
      unit: "Stück",
      materialId: "",
      materialName: "",
      unitPrice: 0
    }
  ],
  tools: [
    {
      id: "tool-line-1",
      quantity: 1,
      toolId: "",
      toolName: "",
      costRate: 0
    }
  ],
  legal: {
    privacyReceived: false,
    cancellationReceived: false,
    workStartApproved: false,
    customerConsent: false,
    consentDeclined: false,
    signatureDataUrl: ""
  },
  photos: [],
  acceptance: {
    serviceCompleted: false,
    systemFunctional: false,
    repairNotPossible: false,
    repairNotPossibleReason: "",
    customerConfirmed: false
  }
};

export function JobWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [customers, setCustomers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs, setJobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const [materialCatalog] = useLocalStorage<MaterialCatalogItem[]>("hsa-materials", mockMaterials);
  const [toolCatalog] = useLocalStorage<ToolCatalogItem[]>("hsa-tools", mockTools);
  const [emergencySurcharges] = useLocalStorage("hsa-emergency-surcharges", mockEmergencySurcharges);
  const [maintenanceChecksCatalog] = useLocalStorage<MaintenanceCheckItem[]>(
    "hsa-maintenance-checks",
    mockMaintenanceChecks
  );
  const [draft, setDraft] = useState<JobDraft>(initialDraft);
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === draft.customerId),
    [customers, draft.customerId]
  );
  const searchParams = useSearchParams();

  // Wenn ein customerId Query-Parameter gesetzt ist, versuchen wir den Kunden vorauszuwählen
  // und direkt auf Schritt 1 zu springen, falls der Kunde existiert und nicht archiviert ist.
  useEffect(() => {
    const paramCustomerId = searchParams?.get("customerId");
    if (!paramCustomerId) return;
    // Falls bereits ein Kunde ausgewählt wurde, nicht überschreiben
    if (draft.customerId) return;
    // Nur beim initialen Schritt reagieren
    if (step !== 0) return;
    const exists = customers.some((c) => c.id === paramCustomerId && c.archived !== true);
    if (exists) {
      queueMicrotask(() => {
        setDraft((d) => ({ ...d, customerId: paramCustomerId }));
        // Direkt zum nächsten Schritt wechseln (Einsatzart), damit der Nutzer sofort mit der Auftragserfassung beginnen kann
        setStep(1);
      });
    }
  }, [searchParams, customers, draft.customerId, step]);

  // Kunden, die für neue Aufträge auswählbar sind (archivierte Kunden ausblenden)
  const selectableCustomers = customers.filter((c) => c.archived !== true);

  const updateDraft = (next: Partial<JobDraft>) => setDraft((current) => ({ ...current, ...next }));
  const canContinue = validateStep(step, draft);
  const canSkip = step > 0 && step < steps.length - 1 && !requiredSteps.has(step);
  const availableMaterials = materialCatalog.filter((material) => material.designation.trim());
  const availableTools = toolCatalog.filter((tool) => tool.designation.trim());
  const availableMaintenanceChecks = maintenanceChecksCatalog.filter((check) => check.designation.trim());

  function saveJob() {
    const nextJob: Job = {
      id: createId("job"),
      ...draft,
      status: draft.acceptance.customerConfirmed === true ? "Abgeschlossen" : "Offen",
      createdAt: new Date().toISOString()
    };
    setJobs([nextJob, ...jobs]);
    router.push("/jobs");
  }

  function abortJob() {
    const abortedJob: Job = {
      id: createId("job"),
      ...draft,
      status: "Abgebrochen",
      description: draft.description || "Auftrag wurde beendet, weil der Kunde nicht zugestimmt hat.",
      createdAt: new Date().toISOString()
    };
    setJobs([abortedJob, ...jobs]);
    router.push("/jobs");
  }

  function updateMaterialLine(lineId: string, next: Partial<JobMaterialLine>) {
    updateDraft({
      materials: (draft.materials ?? []).map((line) => (line.id === lineId ? { ...line, ...next } : line))
    });
  }

  function selectMaterial(lineId: string, materialId: string) {
    const material = materialCatalog.find((item) => item.id === materialId);
    updateMaterialLine(lineId, {
      materialId,
      materialName: material?.designation ?? "",
      unit: material?.unit ?? "Stück",
      unitPrice: material?.unitPrice ?? 0
    });
  }

  function addMaterialLine() {
    updateDraft({
      materials: [
        ...(draft.materials ?? []),
        {
          id: createId("mat-line"),
          quantity: 1,
          unit: "Stück",
          materialId: "",
          materialName: "",
          unitPrice: 0
        }
      ]
    });
  }

  function updateToolLine(lineId: string, next: Partial<JobToolLine>) {
    updateDraft({
      tools: (draft.tools ?? []).map((line) => (line.id === lineId ? { ...line, ...next } : line))
    });
  }

  function selectTool(lineId: string, toolId: string) {
    const tool = toolCatalog.find((item) => item.id === toolId);
    updateToolLine(lineId, {
      toolId,
      toolName: tool?.designation ?? "",
      costRate: tool?.costRate ?? 0
    });
  }

  function addToolLine() {
    updateDraft({
      tools: [
        ...(draft.tools ?? []),
        {
          id: createId("tool-line"),
          quantity: 1,
          toolId: "",
          toolName: "",
          costRate: 0
        }
      ]
    });
  }

  function selectJobType(type: JobType) {
    updateDraft({
      type,
      emergencySurchargePercent:
        type === "Notdienst" ? (draft.emergencySurchargePercent ?? emergencySurcharges[0]?.percent ?? 50) : undefined,
      maintenanceChecks: type === "Wartung" ? (draft.maintenanceChecks ?? []) : []
    });
  }

  function toggleMaintenanceCheck(check: MaintenanceCheckItem) {
    const current = draft.maintenanceChecks ?? [];
    const selected = current.some((item) => item.id === check.id);
    updateDraft({
      maintenanceChecks: selected
        ? current.filter((item) => item.id !== check.id)
        : [...current, { id: check.id, designation: check.designation }]
    });
  }

  return (
    <div className="grid gap-5">
      <ProgressStepper steps={steps} currentStep={step} />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{steps[step]}</CardTitle>
              <CardDescription>
                Schritt {step + 1} von {steps.length}
              </CardDescription>
            </div>
            {selectedCustomer && (
              <Badge>
                {selectedCustomer.customerNumber ? `${selectedCustomer.customerNumber} · ` : ""}
                {formatCustomerName(selectedCustomer.firstName, selectedCustomer.lastName)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={step === 0}
            onClick={() => setStep((current) => current - 1)}
          >
            <ArrowLeft className="h-5 w-5" />
            Zurueck
          </Button>
          {canSkip && (
            <Button type="button" variant="secondary" size="lg" onClick={() => setStep((current) => current + 1)}>
              <SkipForward className="h-5 w-5" />
              Überspringen
            </Button>
          )}
        </div>
        {step === 2 && draft.legal.consentDeclined === true ? (
          <Button type="button" size="lg" variant="outline" onClick={abortJob}>
            <OctagonX className="h-5 w-5" />
            Auftrag beenden
          </Button>
        ) : step < steps.length - 1 ? (
          <Button type="button" size="lg" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
            Weiter
            <ArrowRight className="h-5 w-5" />
          </Button>
        ) : (
          <Button type="button" size="lg" disabled={!canContinue} onClick={saveJob}>
            <Save className="h-5 w-5" />
            Auftrag speichern
          </Button>
        )}
      </div>
    </div>
  );

  function renderStep() {
    if (step === 0) {
      return (
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-3">
            {selectableCustomers.map((customer) => {
              const active = customer.id === draft.customerId;
              return (
                <button
                  type="button"
                  key={customer.id}
                  className={`min-h-20 rounded-lg border bg-white p-4 text-left shadow-sm transition-colors ${
                    active ? "border-sky-400 bg-sky-100 text-slate-950 ring-2 ring-sky-200" : "hover:bg-secondary/50"
                  }`}
                  onClick={() => updateDraft({ customerId: customer.id })}
                >
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    {customer.customerNumber || "Keine Kundennummer"}
                  </span>
                  <span className="block text-base font-semibold">
                    {formatCustomerName(customer.firstName, customer.lastName)}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{formatAddress(customer)}</span>
                  <span className="mt-2 block text-sm font-medium">{customer.phone}</span>
                </button>
              );
            })}
          </div>
          <div className="rounded-lg border bg-secondary/45 p-4">
            <h3 className="mb-4 text-lg font-semibold">Neuen Kunden anlegen</h3>
            <CustomerForm
              onCreate={(customer) => {
                setCustomers([customer, ...customers]);
                updateDraft({ customerId: customer.id });
              }}
            />
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {jobTypes.map((type) => (
            <button
              type="button"
              key={type}
              className={`min-h-24 rounded-lg border bg-white p-4 text-left text-lg font-semibold shadow-sm transition-colors ${
                draft.type === type
                  ? "border-sky-400 bg-sky-100 text-slate-950 ring-2 ring-sky-200"
                  : "hover:bg-secondary/60"
              }`}
              onClick={() => selectJobType(type as JobType)}
            >
              {type}
            </button>
          ))}
          {draft.type === "Notdienst" && (
            <div className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-5">
              <div>
                <h3 className="text-lg font-semibold tracking-normal">Notdienst-Zulage</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Der Aufschlag wird bei Notdienst automatisch angezeigt.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {emergencySurcharges.map((surcharge) => {
                  const selected = draft.emergencySurchargePercent === surcharge.percent;
                  return (
                    <button
                      key={surcharge.id}
                      type="button"
                      className={`min-h-16 rounded-md border px-4 text-left shadow-sm transition-colors ${
                        selected
                          ? "border-sky-400 bg-sky-100 text-slate-950 ring-2 ring-sky-200"
                          : "bg-white hover:bg-secondary/60"
                      }`}
                      onClick={() => updateDraft({ emergencySurchargePercent: surcharge.percent })}
                    >
                      <span className="block text-base font-semibold">{surcharge.label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{surcharge.percent} Prozent</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step === 2) {
      return <LegalStep value={draft.legal} onChange={(legal) => updateDraft({ legal })} />;
    }

    if (step === 3) {
      return (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              placeholder="Auftrag, Schaden, Ursache, Kundenangaben und erste Einschaetzung"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={draft.notes}
              onChange={(event) => updateDraft({ notes: event.target.value })}
              placeholder="Material, Rueckfragen, Besonderheiten vor Ort"
            />
          </div>
          <div className="space-y-2">
            <Label>Fotos aufnehmen oder hochladen</Label>
            <PhotoUploader photos={draft.photos} onChange={(photos) => updateDraft({ photos })} />
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Beginn</Label>
              <Input
                id="startTime"
                type="time"
                value={draft.startTime}
                onChange={(event) => updateDraft({ startTime: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Ende</Label>
              <Input
                id="endTime"
                type="time"
                value={draft.endTime}
                onChange={(event) => updateDraft({ endTime: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="technicianCount">Anzahl der Monteure</Label>
            <select
              id="technicianCount"
              className="flex min-h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={draft.technicianCount ?? 1}
              onChange={(event) => {
                const technicianCount = Number(event.target.value);
                const currentRoles = draft.technicianRoles ?? [];
                const technicianRolesNext = Array.from(
                  { length: technicianCount },
                  (_, index) => currentRoles[index] ?? "Geselle"
                );
                updateDraft({ technicianCount, technicianRoles: technicianRolesNext });
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Qualifikation je Monteur</Label>
            <div className="grid gap-3">
              {Array.from({ length: draft.technicianCount ?? 1 }, (_, index) => {
                const selectedRole = draft.technicianRoles?.[index] ?? "Geselle";
                return (
                  <div
                    key={index}
                    className="grid gap-2 rounded-lg border bg-white p-3 shadow-sm md:grid-cols-[10rem_1fr] md:items-center"
                  >
                    <span className="font-semibold">Monteur {index + 1}</span>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {technicianRoles.map((role) => {
                        const selected = selectedRole === role;
                        return (
                          <button
                            key={role}
                            type="button"
                            className={`min-h-12 rounded-md border px-4 text-left text-sm font-semibold shadow-sm transition-colors ${
                              selected
                                ? "border-sky-400 bg-sky-100 text-slate-950 ring-2 ring-sky-200"
                                : "bg-white hover:bg-secondary/60"
                            }`}
                            onClick={() => {
                              const technicianRolesNext = Array.from(
                                { length: draft.technicianCount ?? 1 },
                                (_, roleIndex) => draft.technicianRoles?.[roleIndex] ?? "Geselle"
                              );
                              technicianRolesNext[index] = role;
                              updateDraft({ technicianRoles: technicianRolesNext });
                            }}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <CostCategorySelector
            label="Anfahrtkosten"
            value={draft.travelCostCategory}
            onChange={(travelCostCategory) => updateDraft({ travelCostCategory })}
            showAmounts
          />

          <CostCategorySelector
            label="Kfz- und Ruestkosten"
            value={draft.vehicleSetupCostCategory}
            onChange={(vehicleSetupCostCategory) => updateDraft({ vehicleSetupCostCategory })}
          />
        </div>
      );
    }

    if (step === 5) {
      const materialLines = draft.materials ?? [];
      const materialSum = materialLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
      const toolLines = draft.tools ?? [];
      const toolSum = toolLines.reduce((sum, line) => sum + line.quantity * line.costRate, 0);

      return (
        <div className="grid gap-6">
          {draft.type === "Wartung" && (
            <div className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm">
              <div>
                <h3 className="text-lg font-semibold tracking-normal">Regelpruefungen / Wartungen</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Konfigurierte Wartungspunkte fuer diesen Auftrag auswaehlen.
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {availableMaintenanceChecks.map((check) => {
                  const selected = draft.maintenanceChecks?.some((item) => item.id === check.id) === true;
                  return (
                    <button
                      key={check.id}
                      type="button"
                      className={`min-h-14 rounded-md border px-4 py-3 text-left text-sm font-semibold shadow-sm transition-colors ${
                        selected
                          ? "border-sky-400 bg-sky-100 text-slate-950 ring-2 ring-sky-200"
                          : "bg-white hover:bg-secondary/60"
                      }`}
                      onClick={() => toggleMaintenanceCheck(check)}
                    >
                      {check.designation}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="min-w-[860px] rounded-lg border bg-white">
              <div className="grid grid-cols-[7rem_9rem_1fr_10rem_11rem] gap-3 border-b bg-secondary/70 px-4 py-3 text-sm font-semibold">
                <span>Anzahl</span>
                <span>Einheit</span>
                <span>Materialart</span>
                <span>Einzelpreis</span>
                <span>Preis</span>
              </div>
              <div className="grid">
                {materialLines.map((line) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-[7rem_9rem_1fr_10rem_11rem] gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.quantity}
                      onChange={(event) => updateMaterialLine(line.id, { quantity: Number(event.target.value) })}
                    />
                    <div className="flex min-h-12 items-center rounded-md border bg-secondary/50 px-3 text-sm font-medium">
                      {line.unit}
                    </div>
                    <select
                      className="min-h-12 rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={line.materialId}
                      onChange={(event) => selectMaterial(line.id, event.target.value)}
                    >
                      <option value="">Material waehlen</option>
                      {availableMaterials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.designation}
                        </option>
                      ))}
                    </select>
                    <div className="flex min-h-12 items-center rounded-md border bg-secondary/50 px-3 text-sm font-medium">
                      {formatCurrency(line.unitPrice)}
                    </div>
                    <div className="flex min-h-12 items-center rounded-md border bg-secondary/50 px-3 text-sm font-semibold">
                      {formatCurrency(line.quantity * line.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button type="button" variant="outline" onClick={addMaterialLine}>
              <Plus className="h-5 w-5" />
              Neue Materialzeile
            </Button>
            <div className="rounded-lg bg-secondary/70 px-4 py-3 text-base font-semibold">
              Materialsumme: {formatCurrency(materialSum)}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-normal">Geraete und Werkzeug</h3>
              <p className="mt-1 text-sm text-muted-foreground">Werkzeugeinsatz mit Anzahl und Kostensatz erfassen.</p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[760px] rounded-lg border bg-white">
                <div className="grid grid-cols-[7rem_1fr_10rem_11rem] gap-3 border-b bg-secondary/70 px-4 py-3 text-sm font-semibold">
                  <span>Anzahl</span>
                  <span>Werkzeug</span>
                  <span>Kostensatz</span>
                  <span>Preis</span>
                </div>
                <div className="grid">
                  {toolLines.map((line) => (
                    <div
                      key={line.id}
                      className="grid grid-cols-[7rem_1fr_10rem_11rem] gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.quantity}
                        onChange={(event) => updateToolLine(line.id, { quantity: Number(event.target.value) })}
                      />
                      <select
                        className="min-h-12 rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={line.toolId}
                        onChange={(event) => selectTool(line.id, event.target.value)}
                      >
                        <option value="">Werkzeug waehlen</option>
                        {availableTools.map((tool) => (
                          <option key={tool.id} value={tool.id}>
                            {tool.designation}
                          </option>
                        ))}
                      </select>
                      <div className="flex min-h-12 items-center rounded-md border bg-secondary/50 px-3 text-sm font-medium">
                        {formatCurrency(line.costRate)}
                      </div>
                      <div className="flex min-h-12 items-center rounded-md border bg-secondary/50 px-3 text-sm font-semibold">
                        {formatCurrency(line.quantity * line.costRate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Button type="button" variant="outline" onClick={addToolLine}>
                <Plus className="h-5 w-5" />
                Neue Werkzeugzeile
              </Button>
              <div className="rounded-lg bg-secondary/70 px-4 py-3 text-base font-semibold">
                Werkzeugsumme: {formatCurrency(toolSum)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 6) {
      return <AcceptanceStep value={draft.acceptance} onChange={(acceptance) => updateDraft({ acceptance })} />;
    }

    return <SummaryStep draft={draft} customer={selectedCustomer} />;
  }
}

function CostCategorySelector({
  label,
  value,
  onChange,
  showAmounts = false
}: {
  label: string;
  value?: CostCategory;
  onChange: (value: CostCategory) => void;
  showAmounts?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-3 md:grid-cols-3">
        {costCategories.map((category) => {
          const selected = value === category.value;
          return (
            <button
              key={category.value}
              type="button"
              className={`min-h-16 rounded-md border px-4 text-left shadow-sm transition-colors ${
                selected
                  ? "border-sky-400 bg-sky-100 text-slate-950 ring-2 ring-sky-200"
                  : "bg-white hover:bg-secondary/60"
              }`}
              onClick={() => onChange(category.value)}
            >
              <span className="block text-base font-semibold">{category.label}</span>
              {showAmounts && <span className="mt-1 block text-sm text-muted-foreground">{category.amount}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function validateStep(step: number, draft: JobDraft) {
  if (step === 0) {
    return Boolean(draft.customerId);
  }
  if (step === 2) {
    return (
      draft.legal.privacyReceived &&
      draft.legal.cancellationReceived &&
      draft.legal.workStartApproved &&
      draft.legal.customerConsent === true &&
      Boolean(draft.legal.signatureDataUrl) &&
      draft.legal.consentDeclined !== true
    );
  }
  return true;
}
