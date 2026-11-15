import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WiderrufPage() {
  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Widerrufsbelehrung</CardTitle>
          <CardDescription>
            Hinweis für Verbraucher bei außerhalb von Geschäftsräumen beauftragten Leistungen
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground">
          <p>
            Verbraucher haben grundsätzlich das Recht, einen außerhalb von Geschäftsräumen geschlossenen Vertrag
            innerhalb der gesetzlichen Frist zu widerrufen. Die Frist beginnt nach Erhalt der Belehrung.
          </p>
          <p>
            Der Widerruf kann durch eine eindeutige Erklärung gegenüber dem Betrieb erfolgen. Bereits erbrachte
            Leistungen können anteilig zu vergüten sein, wenn der Kunde den Beginn der Arbeiten vor Ablauf der
            Widerrufsfrist ausdrücklich verlangt hat.
          </p>
          <p>
            Diese MVP-Fassung dient als digitale Dokumentation der Belehrung und sollte vor produktiver Nutzung
            rechtlich geprüft und betriebsspezifisch angepasst werden.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
