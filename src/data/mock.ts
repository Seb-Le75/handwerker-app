import type { Customer, EmergencySurcharge, Job, MaintenanceCheckItem, MaterialCatalogItem, ToolCatalogItem } from "@/types";

export const mockCustomers: Customer[] = [
  {
    id: "cust-1001",
    customerNumber: "K-1001",
    firstName: "Marlene",
    lastName: "Schneider",
    phone: "+49 171 2233445",
    email: "m.schneider@example.de",
    address: "Lindenstrasse 14, 10249 Berlin"
  },
  {
    id: "cust-1002",
    customerNumber: "K-1002",
    firstName: "Tobias",
    lastName: "Keller",
    phone: "+49 160 9988776",
    email: "tobias.keller@example.de",
    address: "Hafenweg 8, 20457 Hamburg"
  },
  {
    id: "cust-1003",
    customerNumber: "K-1003",
    firstName: "Nora",
    lastName: "Lehmann",
    phone: "+49 176 4455667",
    email: "nora.lehmann@example.de",
    address: "Schlossallee 22, 70173 Stuttgart"
  }
];

export const mockJobs: Job[] = [
  {
    id: "job-24001",
    customerId: "cust-1001",
    type: "Wartung",
    description: "Jahreswartung Gastherme inklusive Sichtpruefung und Funktionskontrolle.",
    startTime: "09:00",
    endTime: "10:30",
    technicianCount: 1,
    technicianRoles: ["Geselle"],
    travelCostCategory: "1",
    vehicleSetupCostCategory: "1",
    maintenanceChecks: [
      { id: "maint-001", designation: "Sichtpruefung der Anlage" },
      { id: "maint-002", designation: "Dichtheitspruefung" }
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
    description: "Undichtigkeit am Eckventil im Gaeste-WC.",
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
      repairNotPossibleReason: "Ersatzteil nicht vor Ort verfuegbar, Nachtermin erforderlich.",
      customerConfirmed: false
    },
    createdAt: "2026-05-29T18:15:00.000Z"
  }
];

export const jobTypes = ["Reparatur", "Notdienst", "Wartung", "Angebot", "Installation"] as const;

const materialSeed: MaterialCatalogItem[] = [
  { id: "mat-001", designation: "Siphon 1 1/4 Zoll", unit: "Stück", unitPrice: 18.9 },
  { id: "mat-002", designation: "Eckventil verchromt", unit: "Stück", unitPrice: 12.5 },
  { id: "mat-003", designation: "Kupferrohr 15 mm", unit: "Länge", unitPrice: 7.8 },
  { id: "mat-004", designation: "Dichtungssatz", unit: "Stück", unitPrice: 6.4 },
  { id: "mat-005", designation: "Heizungswasser Zusatz", unit: "Menge", unitPrice: 14.2 }
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
  { id: "tool-003", designation: "Kernbohrgeraet", costRate: 65 },
  { id: "tool-004", designation: "Leckageortungsgeraet", costRate: 38 },
  { id: "tool-005", designation: "Abdrueckpumpe", costRate: 18 }
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
  { id: "maint-001", designation: "Sichtpruefung der Anlage" },
  { id: "maint-002", designation: "Dichtheitspruefung" },
  { id: "maint-003", designation: "Funktionspruefung Sicherheitsventil" },
  { id: "maint-004", designation: "Anlagendruck pruefen" },
  { id: "maint-005", designation: "Filter reinigen" },
  { id: "maint-006", designation: "Brenner/Heizelement pruefen" },
  { id: "maint-007", designation: "Abgaswerte kontrollieren" },
  { id: "maint-008", designation: "Pumpenlauf pruefen" },
  { id: "maint-009", designation: "Regelung und Thermostat pruefen" },
  { id: "maint-010", designation: "Wartungsprotokoll abschliessen" }
];
