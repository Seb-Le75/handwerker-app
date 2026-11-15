import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateDiscountedTotal, calculateJobTotal, paypalMeUrl } from "@/lib/costs";
import { formatCustomerName, formatAddress } from "@/lib/utils";
import type { CostCategory, Customer, JobDraft, PaymentSettings } from "@/types";

type SummaryStepProps = {
  draft: JobDraft;
  customer?: Customer;
  paymentSettings: PaymentSettings;
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

export function SummaryStep({ draft, customer, paymentSettings }: SummaryStepProps) {
  const materialLines = (draft.materials ?? []).filter((line) => line.materialName);
  const materialSum = materialLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const toolLines = (draft.tools ?? []).filter((line) => line.toolName);
  const toolSum = toolLines.reduce((sum, line) => sum + line.quantity * line.costRate, 0);
  const maintenanceDuration = (draft.maintenanceChecks ?? []).reduce(
    (sum, check) => sum + (check.durationMinutes ?? 0),
    0
  );
  const total = calculateJobTotal(draft);
  const paypalTotal = calculateDiscountedTotal(total, paymentSettings.paypalDiscountPercent);
  const paymentUrl = paypalMeUrl(paymentSettings.paypalMe, paypalTotal);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Einsatzübersicht</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Row label="Kundennummer" value={customer?.customerNumber} />
          <Row label="Kunde" value={customer ? formatCustomerName(customer.firstName, customer.lastName) : ""} />
          <Row label="Einsatzart" value={<Badge>{draft.type}</Badge>} />
          <Row label="Termin" value={`${formatDate(draft.scheduledDate)}, ${draft.scheduledStartTime} Uhr`} />
          <Row label="Telefon" value={customer?.phone} />
          <Row label="E-Mail" value={customer?.email} />
          <Row label="Adresse" value={formatAddress(customer)} />
          <Row label="Arbeitszeit" value={`${draft.startTime || "--:--"} bis ${draft.endTime || "--:--"}`} />
          <Row label="Monteure" value={draft.technicianCount ? `${draft.technicianCount}` : ""} />
          <Row label="Qualifikation" value={technicianRoleLabel(draft.technicianRoles)} />
          <Row label="Anfahrtkosten" value={travelCategoryLabel(draft.travelCostCategory)} />
          <Row label="Kfz- und Rüstkosten" value={categoryLabel(draft.vehicleSetupCostCategory)} />
          {draft.type === "Notdienst" && (
            <Row
              label="Notdienst-Zulage"
              value={draft.emergencySurchargePercent ? `${draft.emergencySurchargePercent} Prozent` : ""}
            />
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
                label="Regelprüfungen / Wartungen"
                value={`${draft.maintenanceChecks?.map((check) => check.designation).join(", ") || "Keine"} · ${maintenanceDuration} Min.`}
              />
            </div>
          )}
          <div className="md:col-span-2">
            <Row
              label="Geräte und Werkzeug"
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
                ? "Vollständig bestätigt"
                : "Unvollständig"
            }
          />
          <Row label="Unterschrift" value={draft.legal.signatureDataUrl ? "Vorhanden" : "Nicht erfasst"} />
          <Row
            label="Abnahme"
            value={
              draft.acceptance.customerConfirmed === true ? "Vom Kunden bestätigt" : "Noch nicht vom Kunden bestätigt"
            }
          />
          <Row
            label="Unterschrift zur Abnahme"
            value={draft.acceptance.signatureDataUrl ? "Vorhanden" : "Nicht erfasst"}
          />
          {draft.acceptance.repairNotPossible === true && (
            <Row label="Reparatur nicht möglich" value={draft.acceptance.repairNotPossibleReason} />
          )}
          <Row label="Fotos" value={`${draft.photos.length} Bild${draft.photos.length === 1 ? "" : "er"}`} />
          <Row label="Gesamtbetrag" value={formatCurrency(total)} />
          {paymentSettings.paypalEnabled && paymentUrl ? (
            <div className="rounded-lg border border-sky-300 bg-sky-50 p-4">
              <p className="font-semibold">Direkt mit PayPal bezahlen</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {paymentSettings.paypalDiscountPercent}% Sofortrabatt · Zahlbetrag {formatCurrency(paypalTotal)}
              </p>
              <Button asChild className="mt-4 w-full" size="lg">
                <a href={paymentUrl} target="_blank" rel="noreferrer">
                  Jetzt {formatCurrency(paypalTotal)} mit PayPal bezahlen
                </a>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "Nicht angegeben";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(`${value}T12:00:00`)
  );
}
