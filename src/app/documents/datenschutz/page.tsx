import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DatenschutzPage() {
  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Datenschutzerklaerung</CardTitle>
          <CardDescription>Information fuer Kunden vor Beginn der Auftragserfassung</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground">
          <p>
            Der Betrieb verarbeitet Kunden- und Auftragsdaten ausschliesslich zur Durchfuehrung, Dokumentation und
            Abrechnung des beauftragten Einsatzes. Dazu gehoeren Kontaktdaten, Einsatzadresse, Schadensbeschreibung,
            Arbeitszeiten, Fotos der betroffenen Anlage sowie Abnahmeinformationen.
          </p>
          <p>
            Die Daten werden im MVP lokal auf diesem Geraet gespeichert. Eine Weitergabe erfolgt nur, wenn sie fuer die
            Auftragserfuellung, gesetzliche Pflichten oder berechtigte Nachweise erforderlich ist.
          </p>
          <p>
            Kunden koennen Auskunft, Berichtigung, Einschraenkung oder Loeschung ihrer Daten verlangen, soweit keine
            gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
