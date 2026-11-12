# Phase 0 – Ergebnis und Gate

**Stand:** 12. November 2026
**Ergebnis:** Technisch abgeschlossen; erste Remote-CI-Ausführung steht bis zum Push aus.

## Umgesetzt

- Node.js 24.15 LTS, npm 11, Next.js 16.4, React 19.3 und TypeScript 6 reproduzierbar gepinnt
- Lockfile durch frisches `npm ci --ignore-scripts` verifiziert
- modernes ESLint-Flat-Config, zielgerichtete Prettier-Baseline und Strict Typecheck
- Vitest-, React-Testing-Library- und Playwright-Grundlage
- Desktop- und iPad-Smoke-Test
- GitHub-CI mit Quality-, PostgreSQL-Integration- und E2E-Jobs
- High/Critical Dependency Gate und Secret Scan
- PostgreSQL-18-Compose-Konfiguration, immutable SQL-Migrationen mit SHA-256 und sichere Seed-Sperre
- validierte Server-/Client-Umgebungsvariablen
- Security Header und wieder erlaubter Browser-Zoom
- ADRs, Rollenmatrix, Systemkontext, Threat Model und Betriebsdokumentation

## Lokal verifizierte Gates

| Gate | Ergebnis |
|---|---|
| frisches `npm ci --ignore-scripts` | bestanden |
| Formatcheck der Phase-0-Dateien | bestanden |
| ESLint ohne Warnungen | bestanden |
| TypeScript | bestanden |
| Unit-Tests | 5/5 bestanden |
| PostgreSQL-Integration | 3/3 bestanden |
| Migration erstmalig | bestanden |
| Migration wiederholt/idempotent | bestanden |
| Production Build | bestanden, 10 Routen |
| Playwright Desktop + iPad | 2/2 bestanden |
| Secret Scan | bestanden |
| npm High/Critical Audit | bestanden |

## Transparente Einschränkungen

- Sieben moderate Befunde verbleiben ausschließlich in der transitiven Lint-Toolchain; siehe `docs/operations/security-baseline.md`.
- Der CI-Workflow ist erstellt und lokal äquivalent geprüft, wurde aber ohne Commit/Push noch nicht auf GitHub ausgeführt.
- Hosting-, Auth- und Storage-Dienste wurden nicht angelegt; Phase 0 autorisiert keine Beschaffung oder Produktivdaten.
- Der Bestands-MVP verwendet weiterhin `localStorage`. Dessen Ablösung beginnt erst in den freigegebenen Domänenslices.

## Angenommene Architekturentscheidungen

- modularer Monolith
- PostgreSQL Shared Schema plus RLS
- Drizzle mit versionierten SQL-Migrationen
- Supabase Auth mit Einladung, Passwort und TOTP-MFA
- Supabase Frankfurt für DB/Auth/private Ursprungsdateien
- Vercel Functions in Frankfurt
- feste Rollen/Permissions zum Start
- UUIDv7, Append-only Audit und Expand–Migrate–Contract

## Nächster Gate-Schritt

Vor Beginn von Phase 1 ist ein Commit/Push mit grüner Remote-CI sinnvoll. Phase 1 selbst beginnt mit Tenancy-Schema, RLS-Policies und den negativen Cross-Tenant-Tests; Auth wird erst danach an denselben Tenant-Kontext gebunden.
