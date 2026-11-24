import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DatenschutzPage() {
  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Datenschutzerklärung</CardTitle>
          <CardDescription>Information für Kunden vor Beginn der Auftragserfassung</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground">
          <p>
            Der Betrieb verarbeitet Kunden- und Auftragsdaten ausschließlich zur Durchführung, Dokumentation und
            Abrechnung des beauftragten Einsatzes. Dazu gehören Kontaktdaten, Einsatzadresse, Schadensbeschreibung,
            Arbeitszeiten, Fotos der betroffenen Anlage sowie Abnahmeinformationen.
          </p>
          <p>
            Die Daten werden in der lokalen Testversion zentral auf dem betriebseigenen Mac mini gespeichert und auf der
            NAS gesichert. Eine Weitergabe erfolgt nur, wenn sie für die Auftragserfüllung, gesetzliche Pflichten oder
            berechtigte Nachweise erforderlich ist.
          </p>
          <p>
            Kunden können Auskunft, Berichtigung, Einschränkung oder Löschung ihrer Daten verlangen, soweit keine
            gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
