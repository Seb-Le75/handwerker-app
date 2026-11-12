# ADR-0003: PostgreSQL und ORM

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

PostgreSQL ist verbindlich. Phase 1 verwendet Drizzle, weil Tenant-Constraints, RLS, SQL-Migrationen und Transaktionen sichtbar bleiben. Die offizielle Drizzle-Dokumentation unterstützt PostgreSQL-RLS-Policies und sowohl generierte als auch eigene SQL-Migrationen.

## Alternativen

- Prisma: sehr gute Entwicklerergonomie, aber zusätzliche Abstraktion bei RLS und spezialisierten SQL-Konstrukten.
- SQL ohne ORM: maximale Kontrolle, höherer Mapping- und Wartungsaufwand.

## Migrationsregel

`drizzle-kit push` ist für gemeinsam genutzte oder produktive Datenbanken verboten. Migrationen werden als prüfbare SQL-Dateien versioniert. Der bestehende kleine Runner bleibt bis zur Phase-1-Integration erhalten.

Quellen: <https://orm.drizzle.team/docs/rls>, <https://orm.drizzle.team/docs/drizzle-kit-generate>
