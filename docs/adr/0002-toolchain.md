# ADR-0002: Node.js und Paketmanagement

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

Node.js 24.15 LTS und npm 11 werden über `.nvmrc`, `engines`, `packageManager` und `package-lock.json` gepinnt. Installationen in CI verwenden `npm ci --ignore-scripts`; notwendige Install-Skripte müssen einzeln begründet werden.

Next.js 16.4 Active LTS und React 19.3 werden exakt gepinnt. TypeScript bleibt vorläufig auf 6.0, weil die Next.js-ESLint-Abhängigkeiten TypeScript 7 noch nicht unterstützen. ESLint 9 bleibt trotz ausgelaufener Upstream-Unterstützung temporär nötig, bis die von Next.js gebündelten Plugins ESLint 10 vollständig unterstützen.

## Folgen

Reproduzierbarkeit vor maximaler Aktualität. Die beiden temporären Pins werden monatlich überprüft.
