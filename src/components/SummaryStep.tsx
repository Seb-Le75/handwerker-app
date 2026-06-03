import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCustomerName } from "@/lib/utils";
import type { CostCategory, Customer, JobDraft } from "@/types";

type SummaryStepProps = {
  draft: JobDraft;
  customer?: Customer;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-md bg-secondary/60 p-3">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <span className="text-base font-medium">{value || "Nicht angegeben"}</span>
    </div>
  );
}

function travelCategoryLabel(category?: CostCategory) {
  if (category === "1") {
    return "Kategorie 1 (15 EUR)";
  }
  if (category === "2") {
    return "Kategorie 2 (25 EUR)";
  }
  if (category === "3") {
    return "Kategorie 3 (35 EUR)";
  }
  return "";
}

function categoryLabel(category?: CostCategory) {
  return category ? `Kategorie ${category}` : "";
}

function technicianRoleLabel(roles?: string[]) {
  return roles?.map((role, index) => `Monteur ${index + 1}: ${role}`).join(", ");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function SummaryStep({ draft, customer }: SummaryStepProps) {
  const materialLines = (draft.materials ?? []).filter((line) => line.materialName);
  const materialSum = materialLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const toolLines = (draft.tools ?? []).filter((line) => line.toolName);
  const toolSum = toolLines.reduce((sum, line) => sum + line.quantity * line.costRate, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Einsatzuebersicht</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Row label="Kundennummer" value={customer?.customerNumber} />
          <Row label="Kunde" value={customer ? formatCustomerName(customer.firstName, customer.lastName) : ""} />
          <Row label="Einsatzart" value={<Badge>{draft.type}</Badge>} />
          <Row label="Telefon" value={customer?.phone} />
          <Row label="E-Mail" value={customer?.email} />
          <Row label="Adresse" value={customer?.address} />
          <Row label="Arbeitszeit" value={`${draft.startTime || "--:--"} bis ${draft.endTime || "--:--"}`} />
          <Row label="Monteure" value={draft.technicianCount ? `${draft.technicianCount}` : ""} />
          <Row label="Qualifikation" value={technicianRoleLabel(draft.technicianRoles)} />
          <Row label="Anfahrtkosten" value={travelCategoryLabel(draft.travelCostCategory)} />
          <Row label="Kfz- und Ruestkosten" value={categoryLabel(draft.vehicleSetupCostCategory)} />
          {draft.type === "Notdienst" && (
            <Row label="Notdienst-Zulage" value={draft.emergencySurchargePercent ? `${draft.emergencySurchargePercent} Prozent` : ""} />
          )}
          <div className="md:col-span-2">
            <Row label="Auftragsdetails" value={draft.description} />
          </div>
          <div className="md:col-span-2">
            <Row label="Notizen" value={draft.notes} />
          </div>
          <div className="md:col-span-2">
            <Row
              label="Material"
              value={
                materialLines.length > 0
                  ? `${materialLines.length} Position${materialLines.length === 1 ? "" : "en"} · ${formatCurrency(materialSum)}`
                  : ""
              }
            />
          </div>
          {draft.type === "Wartung" && (
            <div className="md:col-span-2">
              <Row
                label="Regelpruefungen / Wartungen"
                value={draft.maintenanceChecks?.map((check) => check.designation).join(", ")}
              />
            </div>
          )}
          <div className="md:col-span-2">
            <Row
              label="Geraete und Werkzeug"
              value={
                toolLines.length > 0
                  ? `${toolLines.length} Position${toolLines.length === 1 ? "" : "en"} · ${formatCurrency(toolSum)}`
                  : ""
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumentation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Row
            label="Rechtliches"
            value={
              draft.legal.privacyReceived &&
              draft.legal.cancellationReceived &&
              draft.legal.workStartApproved &&
              draft.legal.customerConsent === true
                ? "Vollstaendig bestaetigt"
                : "Unvollstaendig"
            }
          />
          <Row label="Unterschrift" value={draft.legal.signatureDataUrl ? "Vorhanden" : "Nicht erfasst"} />
          <Row
            label="Abnahme"
            value={draft.acceptance.customerConfirmed === true ? "Vom Kunden bestaetigt" : "Noch nicht vom Kunden bestaetigt"}
          />
          {draft.acceptance.repairNotPossible === true && (
            <Row label="Reparatur nicht moeglich" value={draft.acceptance.repairNotPossibleReason} />
          )}
          <Row label="Fotos" value={`${draft.photos.length} Bild${draft.photos.length === 1 ? "" : "er"}`} />
        </CardContent>
      </Card>
    </div>
  );
}
