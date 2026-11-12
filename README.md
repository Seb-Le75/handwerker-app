# Handwerker Service App

Die bestehende Anwendung ist ein MVP für die digitale Vor-Ort-Auftragserfassung in SHK-Betrieben. Version 2.0 wird gemäß dem Audit in `docs/HANDWERKER_APP_2_AUDIT_UND_IMPLEMENTIERUNGSPROMPT.md` als mandantenfähige SaaS vorbereitet.

## Technische Basis

- Node.js 24 LTS und npm 11
- Next.js 16, React 19 und TypeScript 6
- Tailwind CSS und Radix-basierte UI-Komponenten
- Vitest und Playwright
- PostgreSQL 18 für die lokale Integrationsumgebung

Die Bestandsanwendung speichert Kunden und Aufträge noch lokal im Browser. Diese Persistenz ist ausschließlich Prototypbestand und wird in späteren Phasen ersetzt.

## Lokaler Start

```bash
nvm use
npm ci --ignore-scripts
npm run dev
```

Die lokale PostgreSQL-Grundlage und alle Prüfkommandos sind in `docs/operations/local-development.md` beschrieben.

## Qualität

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run build
npm run test:e2e
npm run security:secrets
```

`npm run verify` bündelt Formatcheck, Lint, Typecheck, Unit-Tests und Produktionsbuild.

## Projektstruktur

```text
src/                  Next.js-Anwendung und bestehender MVP
db/                   SQL-Migrationen und lokale DB-Werkzeuge
tests/                Unit-, Integrations- und E2E-Tests
docs/adr/             Architekturentscheidungen
docs/architecture/    System- und Berechtigungsmodelle
docs/threat-model/    Sicherheitsanalyse
docs/operations/      Betriebs- und Entwicklungsanleitungen
```
