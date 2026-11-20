"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck2, CheckCircle2, FilePenLine, Forward, Receipt } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockCompanySettings, mockCustomers, mockJobs, mockTechnicians } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { calculateDocumentTotals, formatCurrency, formatDate } from "@/lib/documents";
import { localDateKey } from "@/lib/jobs";
import { createJobFromAcceptedOffer } from "@/lib/offer-workflow";
import { formatAddress, formatCustomerName } from "@/lib/utils";
import type { BusinessDocument, BusinessDocumentStatus, CompanySettings, Customer, Job, JobType } from "@/types";

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [documents, setDocuments, hydrated] = useLocalStorage<BusinessDocument[]>("hsa-documents", []);
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [company] = useLocalStorage<CompanySettings>("hsa-company-settings", mockCompanySettings);
  const [jobs, setJobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const [scheduledDate, setScheduledDate] = useState(localDateKey());
  const [scheduledStartTime, setScheduledStartTime] = useState("08:00");
  const [assignedTechnician, setAssignedTechnician] = useState(mockTechnicians[0]);
  const [jobType, setJobType] = useState<JobType>("Installation");
  const document = documents.find((item) => item.id === params.id);
  const customer = document ? customers.find((item) => item.id === document.customerId) : undefined;

  if (!hydrated)
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Dokument wird geladen</CardTitle>
          </CardHeader>
        </Card>
      </AppShell>
    );
  if (!document || !customer)
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Dokument nicht gefunden</CardTitle>
            <CardDescription>Das Dokument ist im gemeinsamen Datenbestand nicht vorhanden.</CardDescription>
          </CardHeader>
        </Card>
      </AppShell>
    );

  const currentDocument = document;
  const documentCustomer: Customer = { ...customer, ...document.customerSnapshot, id: customer.id };
  const linkedJob = document.jobId
    ? jobs.find((job) => job.id === document.jobId)
    : jobs.find((job) => job.sourceDocumentId === document.id);
  const totals = calculateDocumentTotals(document.lineItems);

  function updateStatus(status: BusinessDocumentStatus) {
    setDocuments(
      documents.map((item) =>
        item.id === currentDocument.id ? { ...item, status, updatedAt: new Date().toISOString() } : item
      )
    );
  }

  function convert(type: "Auftragsbestätigung" | "Rechnung") {
    router.push(`/documents/new?sourceId=${currentDocument.id}&type=${encodeURIComponent(type)}`);
  }

  function createOrder() {
    const job = createJobFromAcceptedOffer(currentDocument, {
      scheduledDate,
      scheduledStartTime,
      assignedTechnician,
      jobType
    });
    setJobs([job, ...jobs]);
    setDocuments(
      documents.map((item) =>
        item.id === currentDocument.id ? { ...item, jobId: job.id, updatedAt: new Date().toISOString() } : item
      )
    );
    router.push(`/jobs/${job.id}`);
  }

  return (
    <AppShell>
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/documents">
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/documents/new?documentId=${document.id}`}>
                <FilePenLine className="h-4 w-4" />
                Bearbeiten
              </Link>
            </Button>
            {document.type === "Angebot" && linkedJob ? (
              <Button type="button" variant="outline" onClick={() => convert("Auftragsbestätigung")}>
                <Forward className="h-4 w-4" />
                Auftragsbestätigung erzeugen
              </Button>
            ) : null}
            {document.type !== "Rechnung" && linkedJob?.status === "Abgeschlossen" ? (
              <Button type="button" variant="outline" onClick={() => convert("Rechnung")}>
                <Receipt className="h-4 w-4" />
                Rechnung erzeugen
              </Button>
            ) : null}
          </div>
          <PdfDownloadButton document={document} customer={documentCustomer} company={company} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>
                  {document.type} {document.documentNumber}
                </CardTitle>
                <CardDescription>
                  {formatDate(document.issueDate)} · {customer.customerNumber}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{document.status}</Badge>
                {document.jobId ? <Badge>Auftrag {document.jobId}</Badge> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <section className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-secondary/60 p-4">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Kunde</span>
                <strong className="mt-1 block">
                  {formatCustomerName(documentCustomer.firstName, documentCustomer.lastName)}
                </strong>
                <span className="mt-1 block text-sm">{formatAddress(documentCustomer)}</span>
              </div>
              <div className="rounded-lg bg-secondary/60 p-4">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Betreff</span>
                <strong className="mt-1 block">{document.subject}</strong>
              </div>
            </section>
            <p>{document.introduction}</p>
            <section className="grid gap-3">
              {document.lineItems.map((line, index) => (
                <div
                  key={line.id}
                  className="grid gap-2 rounded-lg border bg-white p-4 sm:grid-cols-[2rem_1fr_auto] sm:items-center"
                >
                  <span className="text-sm text-muted-foreground">{index + 1}</span>
                  <div>
                    <strong>{line.description}</strong>
                    <p className="text-sm text-muted-foreground">
                      {line.quantity} {line.unit} · {formatCurrency(line.unitPrice)} netto · {line.vatRate}% USt.
                    </p>
                  </div>
                  <strong>{formatCurrency(line.quantity * line.unitPrice)}</strong>
                </div>
              ))}
            </section>
            <div className="grid justify-self-end gap-2 rounded-lg bg-secondary/60 p-5 sm:min-w-80">
              <div className="flex justify-between gap-8">
                <span>Netto</span>
                <strong>{formatCurrency(totals.net)}</strong>
              </div>
              <div className="flex justify-between gap-8">
                <span>Umsatzsteuer</span>
                <strong>{formatCurrency(totals.vat)}</strong>
              </div>
              <div className="flex justify-between gap-8 border-t pt-3 text-lg">
                <span>Gesamt</span>
                <strong>{formatCurrency(totals.gross)}</strong>
              </div>
            </div>
            <p className="rounded-lg border bg-white p-4">{document.notes}</p>
          </CardContent>
        </Card>

        {document.type === "Angebot" && document.status === "Angenommen" && !linkedJob ? (
          <Card className="border-primary/35">
            <CardHeader>
              <CardTitle>Angenommenes Angebot als Auftrag einplanen</CardTitle>
              <CardDescription>
                Positionen, Preise und die Kundenadresse werden als unveränderter Stand in den Auftrag übernommen.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="order-job-type">Auftragsart</Label>
                <select
                  id="order-job-type"
                  className="min-h-12 w-full rounded-md border border-input bg-background px-3"
                  value={jobType}
                  onChange={(event) => setJobType(event.target.value as JobType)}
                >
                  <option value="Installation">Installation</option>
                  <option value="Reparatur">Reparatur</option>
                  <option value="Wartung">Wartung</option>
                  <option value="Notdienst">Notdienst</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-date">Einsatzdatum</Label>
                <Input
                  id="order-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-time">Startzeit</Label>
                <Input
                  id="order-time"
                  type="time"
                  value={scheduledStartTime}
                  onChange={(event) => setScheduledStartTime(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-technician">Mitarbeiter</Label>
                <select
                  id="order-technician"
                  className="min-h-12 w-full rounded-md border border-input bg-background px-3"
                  value={assignedTechnician}
                  onChange={(event) => setAssignedTechnician(event.target.value)}
                >
                  {mockTechnicians.map((technician) => (
                    <option value={technician} key={technician}>
                      {technician}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                size="lg"
                className="md:col-span-2 xl:col-span-4 xl:justify-self-end"
                onClick={createOrder}
              >
                <CalendarCheck2 className="h-5 w-5" />
                Auftrag erstellen und einplanen
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {linkedJob ? (
          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong>Verknüpfter Auftrag</strong>
                <p className="text-sm text-muted-foreground">
                  {linkedJob.scheduledDate} · {linkedJob.scheduledStartTime} Uhr · {linkedJob.assignedTechnician}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/jobs/${linkedJob.id}`}>Auftrag öffnen</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          {document.status === "Entwurf" ? (
            <Button type="button" variant="outline" onClick={() => updateStatus("Versendet")}>
              <Forward className="h-4 w-4" />
              Als versendet markieren
            </Button>
          ) : null}
          {document.type === "Angebot" && document.status === "Versendet" ? (
            <Button type="button" onClick={() => updateStatus("Angenommen")}>
              <CheckCircle2 className="h-4 w-4" />
              Als angenommen markieren
            </Button>
          ) : null}
          {document.type === "Rechnung" && document.status !== "Bezahlt" ? (
            <Button type="button" onClick={() => updateStatus("Bezahlt")}>
              <CheckCircle2 className="h-4 w-4" />
              Als bezahlt markieren
            </Button>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
