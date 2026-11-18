"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";

import { DecimalInput } from "@/components/DecimalInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockCompanySettings, mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { calculateDocumentTotals, createDocumentFromJob, documentUnits, formatCurrency } from "@/lib/documents";
import { createId, formatCustomerName } from "@/lib/utils";
import type { BusinessDocument, BusinessDocumentType, CompanySettings, Customer, DocumentLineItem, Job } from "@/types";

export function DocumentEditor({
  jobId,
  type,
  documentId,
  sourceId
}: {
  jobId?: string;
  type?: BusinessDocumentType;
  documentId?: string;
  sourceId?: string;
}) {
  const router = useRouter();
  const [documents, setDocuments, documentsHydrated] = useLocalStorage<BusinessDocument[]>("hsa-documents", []);
  const [jobs, , jobsHydrated] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [company] = useLocalStorage<CompanySettings>("hsa-company-settings", mockCompanySettings);
  const [draft, setDraft] = useState<BusinessDocument | null>(null);

  useEffect(() => {
    if (!documentsHydrated || !jobsHydrated || draft) return;
    const existing = documentId ? documents.find((item) => item.id === documentId) : undefined;
    if (existing) {
      queueMicrotask(() => setDraft(structuredClone(existing)));
      return;
    }
    const source = sourceId ? documents.find((item) => item.id === sourceId) : undefined;
    const job = jobs.find((item) => item.id === (jobId ?? source?.jobId));
    if (!job || !type) return;
    queueMicrotask(() => setDraft(createDocumentFromJob(type, job, documents, company, source)));
  }, [company, documentId, documents, documentsHydrated, draft, jobId, jobs, jobsHydrated, sourceId, type]);

  if (!documentsHydrated || !jobsHydrated || !draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dokument wird vorbereitet</CardTitle>
          <CardDescription>Auftrags- und Kundendaten werden übernommen.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const customer = customers.find((item) => item.id === draft.customerId);
  const totals = calculateDocumentTotals(draft.lineItems);

  function updateLine(id: string, next: Partial<DocumentLineItem>) {
    setDraft((current) =>
      current
        ? { ...current, lineItems: current.lineItems.map((line) => (line.id === id ? { ...line, ...next } : line)) }
        : current
    );
  }

  function addLine() {
    setDraft((current) =>
      current
        ? {
            ...current,
            lineItems: [
              ...current.lineItems,
              {
                id: createId("doc-line"),
                description: "Neue Position",
                quantity: 1,
                unit: "Stück",
                unitPrice: 0,
                vatRate: company.defaultVatRate
              }
            ]
          }
        : current
    );
  }

  function save() {
    if (!draft) return;
    const saved = { ...draft, updatedAt: new Date().toISOString() };
    setDocuments(
      documents.some((item) => item.id === saved.id)
        ? documents.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...documents]
    );
    router.push(`/documents/${saved.id}`);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-3xl font-semibold">
          {documentId ? `${draft.type} bearbeiten` : `${draft.type} erstellen`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {draft.documentNumber} ·{" "}
          {customer ? formatCustomerName(customer.firstName, customer.lastName) : "Kunde nicht gefunden"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dokumentdaten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="document-number">Dokumentnummer</Label>
            <Input id="document-number" value={draft.documentNumber} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-date">Ausstellungsdatum</Label>
            <Input
              id="issue-date"
              type="date"
              value={draft.issueDate}
              onChange={(event) => setDraft({ ...draft, issueDate: event.target.value })}
            />
          </div>
          {draft.type === "Angebot" ? (
            <div className="space-y-2">
              <Label htmlFor="valid-until">Gültig bis</Label>
              <Input
                id="valid-until"
                type="date"
                value={draft.validUntil ?? ""}
                onChange={(event) => setDraft({ ...draft, validUntil: event.target.value })}
              />
            </div>
          ) : null}
          {draft.type === "Rechnung" ? (
            <div className="space-y-2">
              <Label htmlFor="due-date">Fällig am</Label>
              <Input
                id="due-date"
                type="date"
                value={draft.dueDate ?? ""}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              />
            </div>
          ) : null}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="subject">Betreff</Label>
            <Input
              id="subject"
              value={draft.subject}
              onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="introduction">Einleitung</Label>
            <Textarea
              id="introduction"
              value={draft.introduction}
              onChange={(event) => setDraft({ ...draft, introduction: event.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Positionen</CardTitle>
              <CardDescription>Mengen, Preise und Umsatzsteuer vor dem Speichern prüfen.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={addLine}>
              <Plus className="h-4 w-4" /> Position
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {draft.lineItems.map((line, index) => (
            <div key={line.id} className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Position {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraft({ ...draft, lineItems: draft.lineItems.filter((item) => item.id !== line.id) })
                  }
                  disabled={draft.lineItems.length === 1}
                  aria-label={`Position ${index + 1} löschen`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`line-description-${line.id}`}>Beschreibung</Label>
                <Input
                  id={`line-description-${line.id}`}
                  value={line.description}
                  onChange={(event) => updateLine(line.id, { description: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_8rem_1fr_8rem_1fr]">
                <div className="space-y-2">
                  <Label>Menge</Label>
                  <DecimalInput
                    ariaLabel={`Menge Position ${index + 1}`}
                    value={line.quantity}
                    onChange={(quantity) => updateLine(line.id, { quantity })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`line-unit-${line.id}`}>Einheit</Label>
                  <select
                    id={`line-unit-${line.id}`}
                    className="min-h-12 w-full rounded-md border border-input bg-background px-3"
                    value={line.unit}
                    onChange={(event) => updateLine(line.id, { unit: event.target.value as DocumentLineItem["unit"] })}
                  >
                    {documentUnits.map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Einzelpreis netto</Label>
                  <DecimalInput
                    ariaLabel={`Einzelpreis Position ${index + 1}`}
                    value={line.unitPrice}
                    onChange={(unitPrice) => updateLine(line.id, { unitPrice })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>USt. %</Label>
                  <DecimalInput
                    ariaLabel={`Umsatzsteuer Position ${index + 1}`}
                    value={line.vatRate}
                    onChange={(vatRate) => updateLine(line.id, { vatRate })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gesamt netto</Label>
                  <div className="flex min-h-12 items-center rounded-md bg-secondary/60 px-3 font-semibold">
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_20rem]">
          <div className="space-y-2">
            <Label htmlFor="document-notes">Schlusstext / Zahlungsbedingungen</Label>
            <Textarea
              id="document-notes"
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </div>
          <div className="grid content-start gap-2 rounded-lg bg-secondary/60 p-4">
            <div className="flex justify-between">
              <span>Netto</span>
              <strong>{formatCurrency(totals.net)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Umsatzsteuer</span>
              <strong>{formatCurrency(totals.vat)}</strong>
            </div>
            <div className="mt-2 flex justify-between border-t pt-3 text-lg">
              <span>Gesamt</span>
              <strong>{formatCurrency(totals.gross)}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        size="lg"
        className="justify-self-end"
        onClick={save}
        disabled={!draft.subject.trim() || draft.lineItems.some((line) => !line.description.trim())}
      >
        <Save className="h-5 w-5" /> Dokument speichern
      </Button>
    </div>
  );
}
