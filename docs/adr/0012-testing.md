# ADR-0012: Teststrategie

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

- Vitest für Unit- und Node-Integrationstests
- React Testing Library für Komponentenverhalten
- echte PostgreSQL-Instanz für DB-/RLS-Integrationstests
- Playwright für Desktop-Chromium und iPad-Profil
- CI trennt schnelle Qualitäts-, Integrations- und E2E-Jobs

Mocks ersetzen keine Tenant-/RLS- oder Migrationsprüfung.
