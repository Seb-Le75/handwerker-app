# ADR-0013: UUIDv7 als interner Identifikator

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

Neue Domänenobjekte verwenden UUIDv7. Die zeitliche Sortierbarkeit verbessert Indexlokalität; IDs bleiben global eindeutig und enthalten keine Tenant- oder Fachinformation. Externe Dokumentnummern werden separat und transaktional vergeben.

## Folgen

Die konkrete Generatorbibliothek wird zentral gekapselt. APIs dürfen aus IDs keine Berechtigung ableiten.
