import type {
  BusinessDocument,
  BusinessDocumentType,
  CompanySettings,
  DocumentLineItem,
  Job,
  MaterialUnit
} from "@/types";
import { createId } from "@/lib/utils";

const prefixes: Record<BusinessDocumentType, string> = {
  Angebot: "ANG",
  Auftragsbestätigung: "AB",
  Rechnung: "RE"
};

export function nextDocumentNumber(type: BusinessDocumentType, documents: BusinessDocument[], issueDate: string) {
  const year = issueDate.slice(0, 4);
  const prefix = `${prefixes[type]}-${year}-`;
  const highest = documents.reduce((maximum, document) => {
    if (!document.documentNumber.startsWith(prefix)) return maximum;
    const sequence = Number(document.documentNumber.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(maximum, sequence) : maximum;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

export function createDocumentFromJob(
  type: BusinessDocumentType,
  job: Job,
  documents: BusinessDocument[],
  company: CompanySettings,
  sourceDocument?: BusinessDocument
): BusinessDocument {
  const now = new Date();
  const issueDate = localDate(now);
  const lineItems =
    sourceDocument?.lineItems.map((line) => ({ ...line, id: createId("doc-line") })) ??
    jobLines(job, company.defaultVatRate);
  const targetDays = type === "Rechnung" ? company.invoicePaymentDays : company.offerValidityDays;
  const targetDate = addDays(issueDate, targetDays);
  return {
    id: createId("document"),
    documentNumber: nextDocumentNumber(type, documents, issueDate),
    type,
    status: "Entwurf",
    jobId: job.id,
    customerId: job.customerId,
    sourceDocumentId: sourceDocument?.id,
    issueDate,
    validUntil: type === "Angebot" ? targetDate : undefined,
    dueDate: type === "Rechnung" ? targetDate : undefined,
    subject: `${job.type}: ${job.description}`,
    introduction:
      type === "Angebot"
        ? "Vielen Dank für Ihre Anfrage. Gern bieten wir Ihnen die folgenden Leistungen an."
        : type === "Auftragsbestätigung"
          ? "Hiermit bestätigen wir den vereinbarten Auftrag mit den folgenden Leistungen."
          : "Für die ausgeführten Leistungen berechnen wir Ihnen folgende Positionen.",
    lineItems,
    notes:
      type === "Angebot"
        ? `Dieses Angebot ist bis zum ${formatDate(targetDate)} gültig.`
        : type === "Rechnung"
          ? `Bitte überweisen Sie den Rechnungsbetrag bis zum ${formatDate(targetDate)} ohne Abzug.`
          : "Vielen Dank für Ihren Auftrag.",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

export function calculateDocumentTotals(lines: DocumentLineItem[]) {
  const net = round(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  const vatByRate = lines.reduce<Record<string, number>>((totals, line) => {
    const key = String(line.vatRate);
    totals[key] = round((totals[key] ?? 0) + line.quantity * line.unitPrice * (line.vatRate / 100));
    return totals;
  }, {});
  const vat = round(Object.values(vatByRate).reduce((sum, value) => sum + value, 0));
  return { net, vat, gross: round(net + vat), vatByRate };
}

function jobLines(job: Job, vatRate: number): DocumentLineItem[] {
  const lines: DocumentLineItem[] = [];
  for (const material of job.materials ?? []) {
    if (!material.materialName) continue;
    lines.push({
      id: createId("doc-line"),
      description: material.materialName,
      quantity: material.quantity,
      unit: material.unit,
      unitPrice: material.unitPrice,
      vatRate
    });
  }
  for (const tool of job.tools ?? []) {
    if (!tool.toolName) continue;
    lines.push({
      id: createId("doc-line"),
      description: `Geräte-/Werkzeugeinsatz: ${tool.toolName}`,
      quantity: tool.quantity,
      unit: "Stück",
      unitPrice: tool.costRate,
      vatRate
    });
  }
  for (const check of job.maintenanceChecks ?? []) {
    const price = (check.flatRate ?? 0) + (check.travelFlatRate ?? 0);
    if (price <= 0) continue;
    lines.push({
      id: createId("doc-line"),
      description: check.designation,
      quantity: 1,
      unit: "Pauschal",
      unitPrice: price,
      vatRate
    });
  }
  const travelPrice =
    job.travelCostCategory === "1" ? 15 : job.travelCostCategory === "2" ? 25 : job.travelCostCategory === "3" ? 35 : 0;
  if (travelPrice > 0) {
    lines.push({
      id: createId("doc-line"),
      description: "Anfahrt",
      quantity: 1,
      unit: "Pauschal",
      unitPrice: travelPrice,
      vatRate
    });
  }
  if (lines.length === 0) {
    lines.push({
      id: createId("doc-line"),
      description: job.description,
      quantity: 1,
      unit: "Pauschal",
      unitPrice: 0,
      vatRate
    });
  }
  return lines;
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localDate(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(`${value}T12:00:00`)
  );
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const documentUnits: MaterialUnit[] = ["Stück", "m", "cm", "m²", "m³", "ml", "l", "kg", "g", "Pauschal"];
