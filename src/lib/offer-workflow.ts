import { createId } from "@/lib/utils";
import type { BusinessDocument, Job, JobType } from "@/types";

export type OfferSchedule = {
  scheduledDate: string;
  scheduledStartTime: string;
  assignedTechnician: string;
  jobType: JobType;
};

export function createJobFromAcceptedOffer(document: BusinessDocument, schedule: OfferSchedule): Job {
  if (document.type !== "Angebot" || document.status !== "Angenommen") {
    throw new Error("Nur angenommene Angebote können in einen Auftrag umgewandelt werden.");
  }
  if (!schedule.scheduledDate || !schedule.scheduledStartTime || !schedule.assignedTechnician) {
    throw new Error("Termin und zuständiger Mitarbeiter sind erforderlich.");
  }

  const now = new Date().toISOString();
  return {
    id: createId("job"),
    customerId: document.customerId,
    customerSnapshot: document.customerSnapshot,
    sourceDocumentId: document.id,
    type: schedule.jobType,
    description: document.subject,
    scheduledDate: schedule.scheduledDate,
    scheduledStartTime: schedule.scheduledStartTime,
    startTime: "",
    endTime: "",
    technicianCount: 1,
    technicianRoles: ["Geselle"],
    materials: document.lineItems.map((line) => ({
      id: createId("job-line"),
      quantity: line.quantity,
      unit: line.unit,
      materialId: "",
      materialName: line.description,
      unitPrice: line.unitPrice
    })),
    tools: [],
    status: "Offen",
    progress: "Geplant",
    assignedTechnician: schedule.assignedTechnician,
    notes: `Erstellt aus Angebot ${document.documentNumber}. ${document.notes}`,
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
    },
    createdAt: now
  };
}
