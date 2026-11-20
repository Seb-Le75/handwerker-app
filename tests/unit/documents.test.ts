import { describe, expect, it } from "vitest";

import {
  calculateDocumentTotals,
  createDocumentFromJob,
  createOfferForCustomer,
  nextDocumentNumber
} from "@/lib/documents";
import { createJobFromAcceptedOffer } from "@/lib/offer-workflow";
import type { BusinessDocument, CompanySettings, Customer, Job } from "@/types";

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
  bankName: "Musterbank",
  defaultVatRate: 19,
  offerValidityDays: 14,
  invoicePaymentDays: 14
};

const job: Job = {
  id: "job-test",
  customerId: "customer-test",
  type: "Reparatur",
  description: "Waschtischarmatur erneuern",
  startTime: "",
  endTime: "",
  status: "Abgeschlossen",
  notes: "",
  legal: {
    privacyReceived: true,
    cancellationReceived: true,
    workStartApproved: true,
    customerConsent: true,
    consentDeclined: false,
    signatureDataUrl: ""
  },
  photos: [],
  acceptance: {},
  materials: [
    {
      id: "material-1",
      materialId: "catalog-1",
      materialName: "Waschtischarmatur",
      quantity: 1,
      unit: "Stück",
      unitPrice: 120
    }
  ],
  createdAt: "2026-11-17T09:00:00.000Z"
};

const customer: Customer = {
  id: "customer-test",
  customerNumber: "K-4711",
  firstName: "Marlene",
  lastName: "Schneider",
  phone: "069 123456",
  email: "marlene@example.de",
  street: "Goethestraße",
  houseNumber: "18",
  postalCode: "60313",
  city: "Frankfurt am Main"
};

describe("business documents", () => {
  it("assigns a separate sequential number for each document type and year", () => {
    const documents = [
      { documentNumber: "ANG-2026-0003" },
      { documentNumber: "RE-2026-0012" },
      { documentNumber: "ANG-2025-0099" }
    ] as BusinessDocument[];

    expect(nextDocumentNumber("Angebot", documents, "2026-11-17")).toBe("ANG-2026-0004");
    expect(nextDocumentNumber("Auftragsbestätigung", documents, "2026-11-17")).toBe("AB-2026-0001");
    expect(nextDocumentNumber("Rechnung", documents, "2026-11-17")).toBe("RE-2026-0013");
  });

  it("calculates net, VAT by rate, and gross totals", () => {
    const totals = calculateDocumentTotals([
      { id: "1", description: "Leistung", quantity: 2, unit: "Stück", unitPrice: 100, vatRate: 19 },
      { id: "2", description: "Material", quantity: 1, unit: "Stück", unitPrice: 50, vatRate: 7 }
    ]);

    expect(totals).toEqual({ net: 250, vat: 41.5, gross: 291.5, vatByRate: { "7": 3.5, "19": 38 } });
  });

  it("copies source positions when converting an offer into an invoice", () => {
    const offer = createDocumentFromJob("Angebot", job, [], company);
    offer.lineItems[0].unitPrice = 149.9;
    const invoice = createDocumentFromJob("Rechnung", job, [offer], company, offer);

    expect(invoice.documentNumber).toMatch(/^RE-\d{4}-0001$/);
    expect(invoice.sourceDocumentId).toBe(offer.id);
    expect(invoice.lineItems[0]).toMatchObject({ description: "Waschtischarmatur", unitPrice: 149.9 });
    expect(invoice.lineItems[0].id).not.toBe(offer.lineItems[0].id);
  });

  it("creates an offer before an order and freezes the customer data", () => {
    const offer = createOfferForCustomer(customer, [], company);
    customer.street = "Geänderte Straße";

    expect(offer.jobId).toBeUndefined();
    expect(offer.customerSnapshot).toMatchObject({ street: "Goethestraße", customerNumber: "K-4711" });
    expect(offer.lineItems).toHaveLength(1);
  });

  it("turns an accepted offer into a scheduled job with copied positions", () => {
    const offer = createOfferForCustomer(customer, [], company);
    offer.status = "Angenommen";
    offer.lineItems[0] = { ...offer.lineItems[0], description: "Neue Heizungsanlage", unitPrice: 4_500 };

    const scheduledJob = createJobFromAcceptedOffer(offer, {
      scheduledDate: "2026-11-23",
      scheduledStartTime: "08:30",
      assignedTechnician: "Mara Klein",
      jobType: "Installation"
    });

    expect(scheduledJob).toMatchObject({
      customerId: customer.id,
      sourceDocumentId: offer.id,
      scheduledDate: "2026-11-23",
      scheduledStartTime: "08:30",
      assignedTechnician: "Mara Klein",
      status: "Offen"
    });
    expect(scheduledJob.materials?.[0]).toMatchObject({ materialName: "Neue Heizungsanlage", unitPrice: 4_500 });
  });
});
