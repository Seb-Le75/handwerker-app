"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FilePenLine, Forward, Receipt } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCompanySettings, mockCustomers } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { calculateDocumentTotals, formatCurrency, formatDate } from "@/lib/documents";
import { formatAddress, formatCustomerName } from "@/lib/utils";
import type { BusinessDocument, BusinessDocumentStatus, CompanySettings, Customer } from "@/types";

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [documents, setDocuments, hydrated] = useLocalStorage<BusinessDocument[]>("hsa-documents", []);
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [company] = useLocalStorage<CompanySettings>("hsa-company-settings", mockCompanySettings);
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
            {document.type === "Angebot" ? (
              <Button type="button" variant="outline" onClick={() => convert("Auftragsbestätigung")}>
                <Forward className="h-4 w-4" />
                Auftrag bestätigen
              </Button>
            ) : null}
            {document.type !== "Rechnung" ? (
              <Button type="button" variant="outline" onClick={() => convert("Rechnung")}>
                <Receipt className="h-4 w-4" />
                Rechnung erzeugen
              </Button>
            ) : null}
          </div>
          <PdfDownloadButton document={document} customer={customer} company={company} />
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
                <strong className="mt-1 block">{formatCustomerName(customer.firstName, customer.lastName)}</strong>
                <span className="mt-1 block text-sm">{formatAddress(customer)}</span>
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
