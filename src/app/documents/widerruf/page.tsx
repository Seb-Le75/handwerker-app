import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WiderrufPage() {
  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Widerrufsbelehrung</CardTitle>
          <CardDescription>Hinweis fuer Verbraucher bei ausserhalb von Geschaeftsraeumen beauftragten Leistungen</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground">
          <p>
            Verbraucher haben grundsaetzlich das Recht, einen ausserhalb von Geschaeftsraeumen geschlossenen Vertrag
            innerhalb der gesetzlichen Frist zu widerrufen. Die Frist beginnt nach Erhalt der Belehrung.
          </p>
          <p>
            Der Widerruf kann durch eine eindeutige Erklaerung gegenueber dem Betrieb erfolgen. Bereits erbrachte
            Leistungen koennen anteilig zu verguten sein, wenn der Kunde den Beginn der Arbeiten vor Ablauf der
            Widerrufsfrist ausdruecklich verlangt hat.
          </p>
          <p>
            Diese MVP-Fassung dient als digitale Dokumentation der Belehrung und sollte vor produktiver Nutzung rechtlich
            geprueft und betriebsspezifisch angepasst werden.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
