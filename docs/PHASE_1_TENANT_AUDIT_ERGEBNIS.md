# Phase 1 – Tenant-Wechsel, Auditansicht und lokale Demo

**Stand:** 14. November 2026

## Umgesetzter Umfang

- explizite Auswahl des aktiven Betriebs bei mehreren Memberships
- erneute serverseitige Membership-Prüfung bei jedem Wechsel
- HttpOnly-/SameSite-Cookie erst nach erfolgreicher Prüfung und Auditierung
- Tenant-Wechsel als append-only Audit-Event im Zielbetrieb
- tenantgebundene Auditansicht mit `audit.read`-Prüfung
- serverseitige Pagination mit 20 Ereignissen je Seite
- sichere Akteursanzeige ohne Ausgabe der Audit-Metadaten
- idempotenter lokaler Seed mit zwei Betrieben und einem betriebsübergreifenden Demo-Benutzer
- technische Seed-Sperre in Production

## Sicherheitsinvarianten

1. Eine vom Client gesendete Tenant-ID wird niemals direkt als Kontext übernommen.
2. Nur eine aktive Membership aus der validierten Auth-Identität kann ausgewählt werden.
3. Admin-Membership im Zielbetrieb verlangt weiterhin AAL2.
4. Das Kontext-Cookie wird erst nach erfolgreichem Tenant-Transaction- und Auditabschluss gesetzt.
5. Auditabfragen laufen ausschließlich innerhalb des RLS-gebundenen Tenant-Kontexts.
6. Rollen ohne `audit.read` erhalten keine Auditdaten.
7. Der lokale Seed ist wiederholbar und in Production nicht ausführbar.

## Verifikation

- frische PostgreSQL-18-Datenbank mit allen Migrationen: erfolgreich
- 21 Integrationstests in sechs Dateien: grün
- Cross-Tenant-Audit, fehlende Permission, Tenant-Wechsel und wiederholter Seed explizit getestet
- vier Playwright-Tests auf Desktop- und iPad-Profil: grün
- Lint, TypeScript, Unit-Tests, Secret-Scan und Produktions-Build: grün

## Weiter offen

- reale Supabase-Projektverbindung
- E-Mail-Zustellung, Einladungsannahme und erneutes Senden mit Rate Limit
- strukturierte Metriken und Redaction-Tests
- Backup-/Restore-Nachweis und Storage-Pipeline
