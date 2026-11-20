import type {
  Customer,
  CompanySettings,
  EmergencySurcharge,
  Job,
  MaintenanceCheckItem,
  MaterialCatalogItem,
  PaymentSettings,
  ToolCatalogItem
} from "@/types";

const today = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
})();

export const mockCustomers: Customer[] = [
  {
    id: "cust-1001",
    customerNumber: "K-1001",
    firstName: "Marlene",
    lastName: "Schneider",
    phone: "+49 171 2233445",
    email: "m.schneider@example.de",
    // structured address fields
    street: "Lindenstrasse",
    houseNumber: "14",
    postalCode: "10249",
    city: "Berlin",
    // legacy free-text address for backward compatibility
    address: "Lindenstrasse 14, 10249 Berlin",
    archived: false,
    archivedAt: null
  },
  {
    id: "cust-1002",
    customerNumber: "K-1002",
    firstName: "Tobias",
    lastName: "Keller",
    phone: "+49 160 9988776",
    email: "tobias.keller@example.de",
    street: "Hafenweg",
    houseNumber: "8",
    postalCode: "20457",
    city: "Hamburg",
    address: "Hafenweg 8, 20457 Hamburg",
    archived: false,
    archivedAt: null
  },
  {
    id: "cust-1003",
    customerNumber: "K-1003",
    firstName: "Nora",
    lastName: "Lehmann",
    phone: "+49 176 4455667",
    email: "nora.lehmann@example.de",
    street: "Schlossallee",
    houseNumber: "22",
    postalCode: "70173",
    city: "Stuttgart",
    address: "Schlossallee 22, 70173 Stuttgart",
    archived: false,
    archivedAt: null
  }
];

export const mockJobs: Job[] = [
  {
    id: "job-24001",
    customerId: "cust-1001",
    type: "Wartung",
    description: "Jahreswartung Gastherme inklusive Sichtprüfung und Funktionskontrolle.",
    scheduledDate: today,
    scheduledStartTime: "09:00",
    startTime: "09:00",
    endTime: "10:30",
    technicianCount: 1,
    technicianRoles: ["Geselle"],
    travelCostCategory: "1",
    vehicleSetupCostCategory: "1",
    maintenanceChecks: [
      { id: "maint-001", designation: "Sichtprüfung der Anlage" },
      { id: "maint-002", designation: "Dichtheitsprüfung" }
    ],
    materials: [
      {
        id: "mat-line-24001-1",
        quantity: 1,
        unit: "Stück",
        materialId: "mat-001",
        materialName: "Siphon 1 1/4 Zoll",
        unitPrice: 18.9
      }
    ],
    tools: [
      {
        id: "tool-line-24001-1",
        quantity: 1,
        toolId: "tool-001",
        toolName: "Presswerkzeug",
        costRate: 22
      }
    ],
    status: "Abgeschlossen",
    progress: "Büroprüfung",
    assignedTechnician: "Mara Klein",
    notes: "Anlagendruck nachjustiert, Filter gereinigt.",
    legal: {
      privacyReceived: true,
      cancellationReceived: true,
      workStartApproved: true,
      customerConsent: true,
      consentDeclined: false,
      signatureDataUrl: ""
    },
    photos: [],
    acceptance: {
      serviceCompleted: true,
      systemFunctional: true,
      repairNotPossible: false,
      repairNotPossibleReason: "",
      customerConfirmed: true
    },
    createdAt: "2026-05-23T09:00:00.000Z"
  },
  {
    id: "job-24002",
    customerId: "cust-1002",
    type: "Notdienst",
    description: "Undichtigkeit am Eckventil im Gäste-WC.",
    scheduledDate: today,
    scheduledStartTime: "13:30",
    startTime: "18:15",
    endTime: "19:05",
    technicianCount: 2,
    technicianRoles: ["Geselle", "Lehrling"],
    travelCostCategory: "2",
    vehicleSetupCostCategory: "2",
    emergencySurchargePercent: 50,
    materials: [
      {
        id: "mat-line-24002-1",
        quantity: 1,
        unit: "Stück",
        materialId: "mat-002",
        materialName: "Eckventil verchromt",
        unitPrice: 12.5
      }
    ],
    tools: [],
    status: "Offen",
    progress: "Geplant",
    assignedTechnician: "Mara Klein",
    notes: "Ersatzventil vorbereitet, finaler Austausch mit Kundenzustimmung.",
    legal: {
      privacyReceived: true,
      cancellationReceived: true,
      workStartApproved: true,
      customerConsent: true,
      consentDeclined: false,
      signatureDataUrl: ""
    },
    photos: [],
    acceptance: {
      serviceCompleted: false,
      systemFunctional: false,
      repairNotPossible: true,
      repairNotPossibleReason: "Ersatzteil nicht vor Ort verfügbar, Nachtermin erforderlich.",
      customerConfirmed: false
    },
    createdAt: "2026-05-29T18:15:00.000Z"
  }
];

export const jobTypes = ["Reparatur", "Notdienst", "Wartung", "Installation"] as const;

const materialSeed: MaterialCatalogItem[] = [
  { id: "mat-001", designation: "Siphon 1 1/4 Zoll", unit: "Stück", unitPrice: 18.9 },
  { id: "mat-002", designation: "Eckventil verchromt", unit: "Stück", unitPrice: 12.5 },
  { id: "mat-003", designation: "Kupferrohr 15 mm", unit: "m", unitPrice: 7.8 },
  { id: "mat-004", designation: "Dichtungssatz", unit: "Stück", unitPrice: 6.4 },
  { id: "mat-005", designation: "Heizungswasser-Zusatz", unit: "l", unitPrice: 14.2 }
];

export const mockMaterials: MaterialCatalogItem[] = [
  ...materialSeed,
  ...Array.from({ length: 20 }, (_, index) => ({
    id: `mat-${String(index + 6).padStart(3, "0")}`,
    designation: "",
    unit: "Stück" as const,
    unitPrice: 0
  }))
];

const toolSeed: ToolCatalogItem[] = [
  { id: "tool-001", designation: "Presswerkzeug", costRate: 22 },
  { id: "tool-002", designation: "Rohrreinigungsmaschine", costRate: 45 },
  { id: "tool-003", designation: "Kernbohrgerät", costRate: 65 },
  { id: "tool-004", designation: "Leckageortungsgerät", costRate: 38 },
  { id: "tool-005", designation: "Abdrückpumpe", costRate: 18 }
];

export const mockTools: ToolCatalogItem[] = [
  ...toolSeed,
  ...Array.from({ length: 20 }, (_, index) => ({
    id: `tool-${String(index + 6).padStart(3, "0")}`,
    designation: "",
    costRate: 0
  }))
];

export const mockEmergencySurcharges: EmergencySurcharge[] = [
  { id: "surcharge-050", label: "Notdienst 50 Prozent", percent: 50 },
  { id: "surcharge-100", label: "Notdienst 100 Prozent", percent: 100 },
  { id: "surcharge-150", label: "Notdienst 150 Prozent", percent: 150 }
];

export const mockMaintenanceChecks: MaintenanceCheckItem[] = [
  {
    id: "maint-001",
    designation: "Sichtprüfung der Anlage",
    durationMinutes: 15,
    flatRate: 18,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-002",
    designation: "Dichtheitsprüfung",
    durationMinutes: 20,
    flatRate: 28,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-003",
    designation: "Funktionsprüfung Sicherheitsventil",
    durationMinutes: 15,
    flatRate: 22,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-004",
    designation: "Anlagendruck prüfen",
    durationMinutes: 10,
    flatRate: 12,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-005",
    designation: "Filter reinigen",
    durationMinutes: 20,
    flatRate: 25,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-006",
    designation: "Brenner/Heizelement prüfen",
    durationMinutes: 25,
    flatRate: 35,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-007",
    designation: "Abgaswerte kontrollieren",
    durationMinutes: 20,
    flatRate: 30,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-008",
    designation: "Pumpenlauf prüfen",
    durationMinutes: 10,
    flatRate: 15,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-009",
    designation: "Regelung und Thermostat prüfen",
    durationMinutes: 15,
    flatRate: 20,
    travelFlatRate: 0,
    materials: []
  },
  {
    id: "maint-010",
    designation: "Wartungsprotokoll abschließen",
    durationMinutes: 10,
    flatRate: 10,
    travelFlatRate: 0,
    materials: []
  }
];

export const mockPaymentSettings: PaymentSettings = {
  paypalEnabled: false,
  paypalMe: "",
  paypalDiscountPercent: 3
};

export const mockCompanySettings: CompanySettings = {
  companyName: "Hansen Sanitär & Heizung GmbH",
  ownerName: "Mara Klein",
  street: "Werkstraße 12",
  postalCode: "10115",
  city: "Berlin",
  phone: "+49 30 1234567",
  email: "buero@hansen-shk.de",
  taxNumber: "Bitte eintragen",
  vatId: "Bitte eintragen",
  iban: "Bitte eintragen",
  bic: "Bitte eintragen",
  bankName: "Bitte eintragen",
  defaultVatRate: 19,
  offerValidityDays: 14,
  invoicePaymentDays: 14
};

export const mockTechnicians = ["Mara Klein", "Lena Becker", "Jonas Weber"];
