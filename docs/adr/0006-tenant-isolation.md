# ADR-0006: Shared Schema mit Row Level Security

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

Eine gemeinsame PostgreSQL-Datenbank und ein gemeinsames Schema verwenden `tenant_id` in jeder mandantenbezogenen Tabelle. Tenant-konsistente Foreign Keys, serverseitiger Tenant-Kontext und PostgreSQL RLS bilden mehrere unabhängige Schutzschichten.

Die App-DB-Rolle darf RLS nicht umgehen. Tenant-IDs aus Requests werden nie ohne Session-/Membership-Abgleich vertraut.

## Alternativen

Schema oder Datenbank je Tenant erhöhen den Betriebs- und Migrationsaufwand stark und bleiben eine spätere Enterprise-Option.
