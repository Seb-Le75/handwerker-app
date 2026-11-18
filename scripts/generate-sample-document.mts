import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { createBusinessDocumentPdf } from "../src/lib/document-pdf";
import type { BusinessDocument, CompanySettings, Customer } from "../src/types";

const company: CompanySettings = {
  companyName: "Hansen Sanitär & Heizung GmbH",
  ownerName: "Max Hansen",
  street: "Werkstraße 12",
  postalCode: "60311",
  city: "Frankfurt am Main",
  phone: "069 123456",
  email: "info@hansen-shk.de",
  taxNumber: "012 345 67890",
  vatId: "DE123456789",
  iban: "DE02120300000000202051",
  bic: "BYLADEM1001",
  bankName: "Musterbank Frankfurt",
  defaultVatRate: 19,
  offerValidityDays: 14,
  invoicePaymentDays: 14
};

const customer: Customer = {
  id: "sample-customer",
  customerNumber: "K-1001",
  firstName: "Marlene",
  lastName: "Schneider",
  phone: "069 987654",
  email: "marlene.schneider@example.de",
  street: "Goethestraße",
  houseNumber: "18",
  postalCode: "60313",
  city: "Frankfurt am Main"
};

const document: BusinessDocument = {
  id: "sample-offer",
  documentNumber: "ANG-2026-0001",
  type: "Angebot",
  status: "Entwurf",
  jobId: "job-24001",
  customerId: customer.id,
  issueDate: "2026-11-17",
  validUntil: "2026-12-01",
  subject: "Austausch der Waschtischarmatur im Gäste-WC",
  introduction: "Vielen Dank für Ihre Anfrage. Gern bieten wir Ihnen die folgenden Leistungen an.",
  lineItems: [
    {
      id: "line-1",
      description: "Demontage der vorhandenen Armatur und fachgerechte Montage der neuen Waschtischarmatur",
      quantity: 1,
      unit: "Pauschal",
      unitPrice: 185,
      vatRate: 19
    },
    {
      id: "line-2",
      description: "Waschtischarmatur inklusive Anschlussmaterial",
      quantity: 1,
      unit: "Stück",
      unitPrice: 149.9,
      vatRate: 19
    },
    {
      id: "line-3",
      description: "Anfahrt",
      quantity: 1,
      unit: "Pauschal",
      unitPrice: 25,
      vatRate: 19
    }
  ],
  notes:
    "Dieses Angebot ist bis zum 01.12.2026 gültig. Alle Preise verstehen sich einschließlich der ausgewiesenen Umsatzsteuer.",
  createdAt: "2026-11-17T09:00:00.000Z",
  updatedAt: "2026-11-17T09:00:00.000Z"
};

const outputPath = resolve("output/pdf/Beispiel-Angebot-ANG-2026-0001.pdf");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, await createBusinessDocumentPdf(document, customer, company));
process.stdout.write(`${outputPath}\n`);
