"use client";

import Link from "next/link";
import { ChevronRight, FilePlus2, ReceiptText } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { calculateDocumentTotals, formatCurrency, formatDate } from "@/lib/documents";
import { compareJobsByAppointment } from "@/lib/jobs";
import { formatCustomerName } from "@/lib/utils";
import type { BusinessDocument, Customer, Job } from "@/types";

export default function DocumentsPage() {
  const [documents] = useLocalStorage<BusinessDocument[]>("hsa-documents", []);
  const [jobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const sortedDocuments = [...documents].sort((left, right) => right.issueDate.localeCompare(left.issueDate));
  const availableJobs = [...jobs].sort(compareJobsByAppointment).slice(0, 6);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <Badge className="mb-3 bg-accent text-accent-foreground">Backoffice</Badge>
          <h2 className="text-3xl font-semibold">Dokumente</h2>
          <p className="mt-2 text-muted-foreground">
            Angebote, Auftragsbestätigungen und Rechnungen zentral verwalten.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dokument aus Auftrag erstellen</CardTitle>
            <CardDescription>
              Auftragspositionen werden übernommen und können anschließend angepasst werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {availableJobs.map((job) => {
              const customer = customers.find((item) => item.id === job.customerId);
              return (
                <div
                  key={job.id}
                  className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{job.type}</Badge>
                      <Badge>{job.status}</Badge>
                    </div>
                    <h3 className="mt-2 font-semibold">
                      {customer ? formatCustomerName(customer.firstName, customer.lastName) : "Unbekannter Kunde"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{job.description}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button asChild variant="outline">
                      <Link href={`/documents/new?jobId=${job.id}&type=Angebot`}>Angebot</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/documents/new?jobId=${job.id}&type=${encodeURIComponent("Auftragsbestätigung")}`}>
                        Bestätigung
                      </Link>
                    </Button>
                    {job.status === "Abgeschlossen" ? (
                      <Button asChild>
                        <Link href={`/documents/new?jobId=${job.id}&type=Rechnung`}>Rechnung</Link>
                      </Button>
                    ) : (
                      <Button disabled title="Rechnung erst nach Abschluss des Auftrags">
                        Rechnung
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <section className="grid gap-4" aria-labelledby="document-list-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="document-list-heading" className="text-2xl font-semibold">
              Erstellte Dokumente
            </h2>
            <span className="text-sm text-muted-foreground">{documents.length} Dokumente</span>
          </div>
          {sortedDocuments.length > 0 ? (
            sortedDocuments.map((document) => {
              const customer = customers.find((item) => item.id === document.customerId);
              const totals = calculateDocumentTotals(document.lineItems);
              return (
                <Link
                  href={`/documents/${document.id}`}
                  key={document.id}
                  className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="transition hover:border-primary/45">
                    <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{document.type}</Badge>
                          <Badge>{document.status}</Badge>
                        </div>
                        <h3 className="mt-2 text-lg font-semibold">
                          {document.documentNumber} ·{" "}
                          {customer ? formatCustomerName(customer.firstName, customer.lastName) : "Unbekannter Kunde"}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDate(document.issueDate)} · {document.subject}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-5 md:justify-end">
                        <strong className="text-lg">{formatCurrency(totals.gross)}</strong>
                        <ChevronRight className="h-6 w-6 text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          ) : (
            <Card>
              <CardContent className="grid justify-items-center gap-3 py-12 text-center">
                <ReceiptText className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Noch keine kaufmännischen Dokumente erstellt.</p>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <FilePlus2 className="h-4 w-4" />
                  Oben einen Auftrag auswählen
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}
