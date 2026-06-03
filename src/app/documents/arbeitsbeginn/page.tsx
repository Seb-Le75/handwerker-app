import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ArbeitsbeginnPage() {
  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Zustimmung zum Arbeitsbeginn</CardTitle>
          <CardDescription>Bestaetigung fuer sofortige Leistungserbringung vor Ort</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground">
          <p>
            Der Kunde stimmt zu, dass der Betrieb mit der beauftragten Leistung unmittelbar beginnt. Dies betrifft
            insbesondere Notdienst-, Reparatur-, Wartungs- und Installationsarbeiten am Einsatzort.
          </p>
          <p>
            Der Kunde bestaetigt, dass Datenschutzinformation und Widerrufsbelehrung bereitgestellt wurden und dass die
            Leistung vor Ablauf einer moeglichen Widerrufsfrist starten darf.
          </p>
          <p>
            Die Zustimmung wird im Auftrag dokumentiert und zusammen mit den weiteren Einsatzdaten lokal gespeichert.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
