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
export type TechnicianRole = "Lehrling" | "Geselle" | "Meister";
export type CostCategory = "1" | "2" | "3";
export type MaterialUnit = "Stück" | "Menge" | "Länge";

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
};

export type JobMaintenanceCheck = {
  id: string;
  designation: string;
};

export type JobMaterialLine = {
  id: string;
  quantity: number;
  unit: MaterialUnit;
  materialId: string;
  materialName: string;
  unitPrice: number;
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
