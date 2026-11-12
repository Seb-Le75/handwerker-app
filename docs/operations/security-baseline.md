# Security Baseline – Phase 0

## Automatisierte Kontrollen

- ESLint mit Next.js Core Web Vitals und TypeScript-Regeln
- TypeScript Strict Mode
- lokaler Secret Scan und CI-Secret-Gate
- `npm audit --audit-level=high` in CI
- HTTP-Basisheader: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- getrennte Unit-, DB-Integrations- und E2E-Prüfungen

## Bekannte Restrisiken

Der finale npm-Audit-Stand enthält sieben moderate, ausschließlich transitive Befunde in der Entwicklungs-Lintkette `typescript-eslint`/`minimatch`. Es gibt keine hohen oder kritischen Befunde. Ein erzwungenes Override der transitiven Version wird nicht vorgenommen, weil es die von Next.js getestete Lintkombination verlassen würde.

Maßnahme: monatliche Prüfung der Next.js-/ESLint-/TypeScript-Kompatibilität. CI blockiert weiterhin jeden hohen oder kritischen Befund.

## Noch nicht enthalten

Eine Content Security Policy wird zusammen mit Auth, serverseitigen Nonces und den tatsächlich benötigten Drittanbieterursprüngen in Phase 1 eingeführt. Eine pauschale CSP im Prototyp würde entweder die Anwendung brechen oder unnötige `unsafe-*`-Ausnahmen festschreiben.
