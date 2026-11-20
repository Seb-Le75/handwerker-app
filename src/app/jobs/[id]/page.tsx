"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileText, ImageIcon, Receipt, Wrench } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatAppointment, jobProgressLabel } from "@/lib/jobs";
import { formatCustomerName, formatDateTime, formatAddress } from "@/lib/utils";
import type { CostCategory, Customer, Job } from "@/types";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-secondary/60 p-3">
      <span className="block text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <span className="mt-1 block text-base font-medium">{value || "Nicht erfasst"}</span>
    </div>
  );
}

function travelCategoryLabel(category?: CostCategory) {
  if (category === "1") {
    return "Kategorie 1 (15 EUR)";
  }
  if (category === "2") {
    return "Kategorie 2 (25 EUR)";
  }
  if (category === "3") {
    return "Kategorie 3 (35 EUR)";
  }
  return "";
}

function categoryLabel(category?: CostCategory) {
  return category ? `Kategorie ${category}` : "";
}

function technicianRoleLabel(roles?: string[]) {
  return roles?.map((role, index) => `Monteur ${index + 1}: ${role}`).join(", ");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [customers, , customersHydrated] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs, , jobsHydrated] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const job = jobs.find((item) => item.id === params.id);
  const customer = job ? customers.find((item) => item.id === job.customerId) : undefined;
  const displayCustomer = customer && job ? { ...customer, ...job.customerSnapshot, id: customer.id } : customer;

  if (!customersHydrated || !jobsHydrated) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Auftrag wird geladen</CardTitle>
            <CardDescription>Die lokalen Daten werden vorbereitet.</CardDescription>
          </CardHeader>
        </Card>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Auftrag nicht gefunden</CardTitle>
            <CardDescription>Dieser Auftrag ist lokal auf diesem Gerät nicht vorhanden.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/jobs">
                <ArrowLeft className="h-4 w-4" />
                Zurück zu den Aufträgen
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const materialLines = (job.materials ?? []).filter((line) => line.materialName);
  const materialSum = materialLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const toolLines = (job.tools ?? []).filter((line) => line.toolName);
  const toolSum = toolLines.reduce((sum, line) => sum + line.quantity * line.costRate, 0);

  return (
    <AppShell>
      <div className="grid gap-5">
        <div className="print-hidden flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/jobs">
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href={`/new?jobId=${encodeURIComponent(job.id)}&step=acceptance`}>
                <Wrench className="h-5 w-5" />
                {job.status === "Abgeschlossen" ? "Abnahme bearbeiten" : "Einsatz abschließen"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/new?jobId=${encodeURIComponent(job.id)}`}>Auftragsdaten bearbeiten</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/documents/new?jobId=${encodeURIComponent(job.id)}&type=Angebot`}>
                <FileText className="h-4 w-4" />
                Angebot erstellen
              </Link>
            </Button>
            {job.status === "Abgeschlossen" ? (
              <Button asChild variant="outline">
                <Link href={`/documents/new?jobId=${encodeURIComponent(job.id)}&type=Rechnung`}>
                  <Receipt className="h-4 w-4" />
                  Rechnung erstellen
                </Link>
              </Button>
            ) : null}
          </div>
          <Button variant="outline" size="lg" onClick={() => window.print()}>
            <Download className="h-5 w-5" />
            PDF erstellen
          </Button>
        </div>

        <Card className="print-card">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Auftragsprotokoll {job.id}</CardTitle>
                <CardDescription>
                  Termin: {formatAppointment(job)} · Erfasst: {formatDateTime(job.createdAt)}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{job.type}</Badge>
                <Badge>{job.status}</Badge>
                <Badge className="bg-white">{jobProgressLabel(job)}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <section className="grid gap-3 md:grid-cols-2">
              <DetailRow label="Kundennummer" value={displayCustomer?.customerNumber} />
              <DetailRow
                label="Kunde"
                value={
                  displayCustomer
                    ? formatCustomerName(displayCustomer.firstName, displayCustomer.lastName)
                    : "Unbekannter Kunde"
                }
              />
              <DetailRow label="Telefon" value={displayCustomer?.phone} />
              <DetailRow label="E-Mail" value={displayCustomer?.email} />
              <DetailRow label="Adresse" value={formatAddress(displayCustomer)} />
            </section>

            {job.type === "Wartung" && (
              <section className="grid gap-3">
                <h2 className="text-lg font-semibold tracking-normal">Regelprüfungen / Wartungen</h2>
                {job.maintenanceChecks && job.maintenanceChecks.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {job.maintenanceChecks.map((check) => (
                      <div key={check.id} className="rounded-md border bg-white p-3 text-sm font-medium shadow-sm">
                        {check.designation}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-secondary/50 p-4 text-muted-foreground">
                    Keine Regelprüfungen ausgewählt
                  </div>
                )}
              </section>
            )}

            <section className="grid gap-3">
              <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <h2 className="text-lg font-semibold tracking-normal">Material</h2>
                <span className="font-semibold">Summe: {formatCurrency(materialSum)}</span>
              </div>
              {materialLines.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border bg-white">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-[7rem_8rem_1fr_10rem_10rem] gap-3 border-b bg-secondary/70 px-4 py-3 text-sm font-semibold">
                      <span>Anzahl</span>
                      <span>Einheit</span>
                      <span>Materialart</span>
                      <span>Einzelpreis</span>
                      <span>Preis</span>
                    </div>
                    {materialLines.map((line) => (
                      <div
                        key={line.id}
                        className="grid grid-cols-[7rem_8rem_1fr_10rem_10rem] gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                      >
                        <span>{line.quantity}</span>
                        <span>{line.unit}</span>
                        <span>{line.materialName}</span>
                        <span>{formatCurrency(line.unitPrice)}</span>
                        <span className="font-semibold">{formatCurrency(line.quantity * line.unitPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-secondary/50 p-4 text-muted-foreground">
                  Keine Materialien erfasst
                </div>
              )}
            </section>

            <section className="grid gap-3">
              <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <h2 className="text-lg font-semibold tracking-normal">Geräte und Werkzeug</h2>
                <span className="font-semibold">Summe: {formatCurrency(toolSum)}</span>
              </div>
              {toolLines.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border bg-white">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[7rem_1fr_10rem_10rem] gap-3 border-b bg-secondary/70 px-4 py-3 text-sm font-semibold">
                      <span>Anzahl</span>
                      <span>Werkzeug</span>
                      <span>Kostensatz</span>
                      <span>Preis</span>
                    </div>
                    {toolLines.map((line) => (
                      <div
                        key={line.id}
                        className="grid grid-cols-[7rem_1fr_10rem_10rem] gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                      >
                        <span>{line.quantity}</span>
                        <span>{line.toolName}</span>
                        <span>{formatCurrency(line.costRate)}</span>
                        <span className="font-semibold">{formatCurrency(line.quantity * line.costRate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-secondary/50 p-4 text-muted-foreground">
                  Keine Werkzeuge erfasst
                </div>
              )}
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <DetailRow label="Einsatzart" value={job.type} />
              <DetailRow label="Arbeitszeit" value={`${job.startTime || "--:--"} bis ${job.endTime || "--:--"}`} />
              <DetailRow label="Monteure" value={job.technicianCount ? `${job.technicianCount}` : ""} />
              <DetailRow label="Zugewiesen an" value={job.assignedTechnician} />
              <DetailRow label="Qualifikation" value={technicianRoleLabel(job.technicianRoles)} />
              <DetailRow label="Anfahrtkosten" value={travelCategoryLabel(job.travelCostCategory)} />
              <DetailRow label="Kfz- und Rüstkosten" value={categoryLabel(job.vehicleSetupCostCategory)} />
              {job.type === "Notdienst" && (
                <DetailRow
                  label="Notdienst-Zulage"
                  value={job.emergencySurchargePercent ? `${job.emergencySurchargePercent} Prozent` : ""}
                />
              )}
              <div className="md:col-span-2">
                <DetailRow label="Auftragsdetails" value={job.description} />
              </div>
              <div className="md:col-span-2">
                <DetailRow label="Notizen" value={job.notes} />
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <DetailRow
                label="Rechtliches"
                value={
                  job.legal.consentDeclined === true
                    ? "Kunde hat nicht zugestimmt"
                    : job.legal.privacyReceived &&
                        job.legal.cancellationReceived &&
                        job.legal.workStartApproved &&
                        job.legal.customerConsent === true
                      ? "Datenschutz, Widerruf, Arbeitsbeginn und Zustimmung bestätigt"
                      : "Unvollständig"
                }
              />
              <DetailRow
                label="Unterschrift Rechtliches"
                value={job.legal.signatureDataUrl ? "Vorhanden" : "Nicht erfasst"}
              />
              {job.legal.signatureDataUrl && (
                <div className="md:col-span-2">
                  <div className="rounded-md bg-secondary/60 p-3">
                    <span className="block text-xs font-semibold uppercase text-muted-foreground">
                      Kundenunterschrift
                    </span>
                    <img
                      src={job.legal.signatureDataUrl}
                      alt="Kundenunterschrift"
                      className="mt-3 h-28 max-w-full rounded-md border bg-white object-contain"
                    />
                  </div>
                </div>
              )}
              <DetailRow
                label="Abnahme"
                value={
                  job.acceptance.customerConfirmed === true ? "Vom Kunden bestätigt" : "Nicht vom Kunden bestätigt"
                }
              />
              <DetailRow
                label="Leistung erbracht"
                value={job.acceptance.serviceCompleted === true ? "Ja" : "Nicht bestätigt"}
              />
              <DetailRow
                label="Anlage funktionsfähig"
                value={job.acceptance.systemFunctional === true ? "Ja" : "Nicht bestätigt"}
              />
              <DetailRow
                label="Reparatur nicht möglich"
                value={job.acceptance.repairNotPossible === true ? "Ja" : "Nein"}
              />
              {job.acceptance.repairNotPossible === true && (
                <div className="md:col-span-2">
                  <DetailRow
                    label="Bemerkung zur nicht möglichen Reparatur"
                    value={job.acceptance.repairNotPossibleReason}
                  />
                </div>
              )}
              <DetailRow
                label="Unterschrift zur Abnahme"
                value={job.acceptance.signatureDataUrl ? "Vorhanden" : "Nicht erfasst"}
              />
              {job.acceptance.signatureDataUrl && (
                <div className="md:col-span-2">
                  <div className="rounded-md bg-secondary/60 p-3">
                    <span className="block text-xs font-semibold uppercase text-muted-foreground">
                      Unterschrift zur Auftragsabnahme
                    </span>
                    <img
                      src={job.acceptance.signatureDataUrl}
                      alt="Unterschrift zur Auftragsabnahme"
                      className="mt-3 h-28 max-w-full rounded-md border bg-white object-contain"
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-3">
              <h2 className="text-lg font-semibold tracking-normal">Fotos</h2>
              {job.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {job.photos.map((photo) => (
                    <figure key={photo.id} className="overflow-hidden rounded-lg border bg-white">
                      <img src={photo.dataUrl} alt={photo.name} className="aspect-square w-full object-cover" />
                      <figcaption className="truncate px-3 py-2 text-xs text-muted-foreground">{photo.name}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-24 items-center gap-3 rounded-lg border bg-secondary/50 p-4 text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                  Keine Fotos hinterlegt
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
