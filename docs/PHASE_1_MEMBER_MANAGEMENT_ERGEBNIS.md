# Phase 1 – Mitgliederverwaltung und Admin-Schutz

**Stand:** 14. November 2026

## Umgesetzter Umfang

- serverseitige Permission-Prüfung für jede Mitglieder-Mutation
- Einladungen mit 256-Bit-Zufallstoken und ausschließlich gespeichertem SHA-256-Digest
- sieben Tage Gültigkeit und nur eine offene Einladung je Tenant/E-Mail-Adresse
- Widerruf offener Einladungen
- Rollenwechsel mit validierten Systemrollen
- Deaktivierung statt historienloser Löschung
- transaktionaler Schutz des letzten aktiven Inhabers/Admins
- Audit-Events für Einladung, Widerruf, Rollenwechsel und Deaktivierung
- sichtbare Admin-Oberfläche für Einladung, Rollen und offene Einladungen
- eindeutig gekennzeichneter, nicht mutierender lokaler Vorschaumodus

## Sicherheitsinvarianten

1. Jede Server Action authentifiziert und autorisiert erneut; die UI ist keine Sicherheitsgrenze.
2. Ziel-IDs werden innerhalb des gebundenen Tenant-Kontexts erneut aus der Datenbank gelesen.
3. Mitgliederzeilen eines Tenants werden vor Admin-Änderungen gesperrt, damit parallele Requests nicht beide den letzten Admin entfernen können.
4. Einladungstoken erscheinen weder in Datenbank noch Audit-Metadaten oder Logs im Klartext.
5. Audit-Ereignis und fachliche Änderung erfolgen in derselben Transaktion.

## Verifikation

- frische PostgreSQL-18-Datenbank mit Migrationen `0000` bis `0003`: erfolgreich
- 16 Integrationstests: grün
- Lint, TypeScript, Unit-Tests, Secret-Scan und Produktions-Build: grün
- vier Playwright-Tests auf Desktop- und iPad-Profil: grün

## Bewusst noch offen

- reale E-Mail-Zustellung über das freizugebende Supabase-Projekt
- Annahme einer Einladung und sichere Konto-/Membership-Verknüpfung
- erneutes Senden mit Rate Limit
- Tenant-Wechsel mit Audit-Event
- paginierte Audit-Ansicht

Ohne konfigurierte Auth- und E-Mail-Infrastruktur werden keine externen Nachrichten versendet und keine echten
Einladungen in der Vorschau gespeichert.
