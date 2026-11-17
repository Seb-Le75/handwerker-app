# Mac-mini-Server mit Synology-Sicherung

## Zielbild

- Der Mac mini führt die Next.js-App aus und speichert den aktiven gemeinsamen Datenstand lokal.
- iPad und Büro-PC greifen im Heimnetz oder über das bestehende VPN auf den Mac mini zu.
- Die Synology DS118 erhält bei jeder Änderung eine aktuelle Kopie und einen Tagesstand.
- Ist die NAS vorübergehend nicht erreichbar, arbeitet die App weiter. Die nächste Änderung versucht die Sicherung erneut.

Eine aktive Datenbank wird nicht direkt auf der SMB-Freigabe betrieben. Verbindungsabbrüche könnten sie beschädigen und die DS118 ist nicht als Anwendungsserver ausgelegt.

## Konfiguration

Die lokale, nicht eingecheckte `.env.local` enthält:

```dotenv
NEXT_PUBLIC_SHARED_DEMO_STORAGE=true
SHARED_DEMO_STORAGE=true
HANDWERKER_DATA_DIR="/Users/sebleins/Library/Application Support/HandwerkerApp/data"
HANDWERKER_BACKUP_DIR="/Volumes/NAS-Archiv/Handwerker-App/backups"
```

Die NAS-Freigabe muss vor dem Start unter `/Volumes/NAS-Archiv` eingebunden sein. Der Serverstatus wird im App-Kopf angezeigt.

## Verhalten

- Zulässige gemeinsame Bereiche: Kunden, Aufträge, Material, Werkzeuge, Zuschläge, Wartungen und Zahlungseinstellungen.
- Änderungen werden sofort an den Mac mini übertragen.
- Andere geöffnete Geräte übernehmen Änderungen spätestens nach fünf Sekunden oder beim erneuten Aktivieren des Fensters.
- Bei einer Unterbrechung bleibt die letzte Gerätekopie nutzbar.
- Einzelne Nutzdaten sind auf 25 MB begrenzt. Fotos werden bereits vor der Speicherung komprimiert.

## Grenzen der Demo

Diese Speicherung ist für Vorführungen und einen kontrollierten Pilotbetrieb gedacht. Sie ersetzt noch keine Benutzeranmeldung, revisionssichere Datenbank oder Konfliktauflösung für gleichzeitige Änderungen am selben Auftrag. Für echte Kundendaten folgt später die produktive Backend- und Datenschutzstufe.
