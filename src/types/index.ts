export type Customer = {
  id: string;
  customerNumber?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  // Freitext-Addressfeld (alt, optional - wird als Fallback verwendet)
  address?: string;
  // Neue strukturierte Adressfelder
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  // Archivierungsstatus: true = Kunde ist archiviert und wird standardmäßig ausgeblendet
  archived?: boolean;
  // Zeitpunkt der Archivierung (optional)
  archivedAt?: string | null;
};

export type JobType = "Reparatur" | "Notdienst" | "Wartung" | "Angebot" | "Installation";

export type JobStatus = "Entwurf" | "Offen" | "Abgeschlossen" | "Abgebrochen";
export type JobProgress = "Geplant" | "Unterwegs" | "In Arbeit" | "Büroprüfung";
export type TechnicianRole = "Lehrling" | "Geselle" | "Meister";
export type CostCategory = "1" | "2" | "3";
export type MaterialUnit = "Stück" | "m" | "cm" | "m²" | "m³" | "ml" | "l" | "kg" | "g" | "Pauschal";

export type LegalConsent = {
  privacyReceived: boolean;
  cancellationReceived: boolean;
  workStartApproved: boolean;
  customerConsent: boolean;
  consentDeclined: boolean;
  signatureDataUrl: string;
};

export type Acceptance = {
  serviceCompleted?: boolean;
  systemFunctional?: boolean;
  repairNotPossible?: boolean;
  repairNotPossibleReason?: string;
  customerConfirmed?: boolean;
  signatureDataUrl?: string;
};

export type UploadedPhoto = {
  id: string;
  name: string;
  dataUrl: string;
};

export type MaterialCatalogItem = {
  id: string;
  designation: string;
  unit: MaterialUnit;
  unitPrice: number;
};

export type ToolCatalogItem = {
  id: string;
  designation: string;
  costRate: number;
};

export type EmergencySurcharge = {
  id: string;
  label: string;
  percent: number;
};

export type MaintenanceCheckItem = {
  id: string;
  designation: string;
  durationMinutes?: number;
  flatRate?: number;
  travelFlatRate?: number;
  materials?: MaintenanceMaterialDefault[];
};

export type MaintenanceMaterialDefault = {
  materialId: string;
  quantity: number;
};

export type JobMaintenanceCheck = MaintenanceCheckItem;

export type PaymentSettings = {
  paypalEnabled: boolean;
  paypalMe: string;
  paypalDiscountPercent: number;
};

export type CompanySettings = {
  companyName: string;
  ownerName: string;
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  taxNumber: string;
  vatId: string;
  iban: string;
  bic: string;
  bankName: string;
  defaultVatRate: number;
  offerValidityDays: number;
  invoicePaymentDays: number;
};

export type BusinessDocumentType = "Angebot" | "Auftragsbestätigung" | "Rechnung";
export type BusinessDocumentStatus = "Entwurf" | "Versendet" | "Angenommen" | "Bezahlt" | "Storniert";

export type DocumentLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit: MaterialUnit;
  unitPrice: number;
  vatRate: number;
};

export type BusinessDocument = {
  id: string;
  documentNumber: string;
  type: BusinessDocumentType;
  status: BusinessDocumentStatus;
  jobId?: string;
  customerId: string;
  sourceDocumentId?: string;
  issueDate: string;
  validUntil?: string;
  dueDate?: string;
  subject: string;
  introduction: string;
  lineItems: DocumentLineItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type JobMaterialLine = {
  id: string;
  quantity: number;
  unit: MaterialUnit;
  materialId: string;
  materialName: string;
  unitPrice: number;
  sourceMaintenanceId?: string;
};

export type JobToolLine = {
  id: string;
  quantity: number;
  toolId: string;
  toolName: string;
  costRate: number;
};

export type Job = {
  id: string;
  customerId: string;
  type: JobType;
  description: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  startTime: string;
  endTime: string;
  technicianCount?: number;
  technicianRoles?: TechnicianRole[];
  travelCostCategory?: CostCategory;
  vehicleSetupCostCategory?: CostCategory;
  emergencySurchargePercent?: number;
  materials?: JobMaterialLine[];
  tools?: JobToolLine[];
  maintenanceChecks?: JobMaintenanceCheck[];
  status: JobStatus;
  progress?: JobProgress;
  assignedTechnician?: string;
  officeReviewedAt?: string;
  notes: string;
  legal: LegalConsent;
  photos: UploadedPhoto[];
  acceptance: Acceptance;
  createdAt: string;
};

export type JobDraft = {
  customerId: string;
  type: JobType;
  description: string;
  scheduledDate: string;
  scheduledStartTime: string;
  notes: string;
  startTime: string;
  endTime: string;
  technicianCount?: number;
  technicianRoles?: TechnicianRole[];
  travelCostCategory?: CostCategory;
  vehicleSetupCostCategory?: CostCategory;
  emergencySurchargePercent?: number;
  materials?: JobMaterialLine[];
  tools?: JobToolLine[];
  maintenanceChecks?: JobMaintenanceCheck[];
  legal: LegalConsent;
  photos: UploadedPhoto[];
  acceptance: Acceptance;
};
