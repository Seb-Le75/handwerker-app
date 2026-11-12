# Phase 1 – Tenancy-, RLS- und Isolation-Slice

**Stand:** 12. November 2026

## Umgesetzter Umfang

- Drizzle ORM als typisierte PostgreSQL-Schicht
- PostgreSQL-18-Migration `0001_tenancy_foundation.sql`
- Tabellen für Tenants, Einstellungen, globale Benutzeridentitäten, Memberships, Einladungen und Audit-Events
- feste Systemrollen und initiale Permissions gemäß ADR-0005
- UUIDv7 als Datenbankstandard
- tenantkonsistente Unique Constraints und zusammengesetzte Fremdschlüssel
- nicht anmeldbare App-Rolle ohne Superuser-, Create-Role-, Create-DB- oder RLS-Bypass-Recht
- aktiviertes und erzwungenes RLS auf allen geschützten Tabellen
- append-only Audit-Rechte für die App-Rolle
- transaktionaler Tenant-Kontext mit Prüfung einer aktiven Membership

## Sicherheitsinvarianten

1. Ohne Tenant-Kontext liefert die App-Rolle keine Tenant-Daten.
2. Ein Tenant-Kontext kann keine Zeilen eines anderen Tenants lesen, ändern oder löschen.
3. Neue Zeilen mit abweichender Tenant-ID werden durch `WITH CHECK` abgewiesen.
4. Tenantgebundene Fremdschlüssel verhindern Referenzen auf Memberships anderer Betriebe.
5. Audit-Events können von der App-Rolle angelegt und gelesen, aber nicht geändert oder gelöscht werden.
6. Ein Drizzle-Service erhält die gebundene Transaktion erst nach Prüfung einer aktiven Membership.

## Verifikation

- Migration auf einer frischen PostgreSQL-18-Datenbank: erfolgreich
- wiederholte Migration mit unveränderten Checksummen: erfolgreich
- PostgreSQL-Integrationstests: 10 grün, davon 7 Tenancy-/RLS-Testfälle
- TypeScript und ESLint: grün
- High-/Critical-Dependency-Gate und Secret-Scan: grün

`npm audit` meldet 11 moderate Befunde ausschließlich in Entwicklungswerkzeugen. Vier davon stammen aus der aktuellen `drizzle-kit`-Kette; der vorgeschlagene automatische Fix wäre ein inkompatibles Downgrade und wurde deshalb nicht angewendet.

## Noch nicht Teil dieses Slices

- Supabase-Auth- und Session-Anbindung
- Einladungsannahme und realer E-Mail-Versand
- zentrale Permission-Policies oberhalb der Tenant-Isolation
- Schutz des letzten aktiven Inhaber/Admins
- Admin-Oberfläche und Audit-Ansicht

Diese Punkte folgen in weiteren Phase-1-Slices. Es wurden keine produktiven Dienste, echten Benutzer oder Kundendaten verwendet.
