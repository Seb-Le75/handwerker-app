# ADR-0001: Modularer Monolith

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

Version 2.0 wird als modularer Monolith in einer Next.js-/TypeScript-Codebasis aufgebaut. Domänenmodule besitzen klare Application-, Domain- und Infrastructure-Grenzen. Externe Effekte werden über Outbox/Jobs entkoppelt.

## Alternativen

- Microservices: für Team- und Produktreife zu hoher Betriebs- und Konsistenzaufwand.
- Unstrukturierter Monolith: schneller Start, aber keine belastbaren Fachgrenzen.

## Folgen

Ein Deployment und eine Datenbank zum Start; spätere Extraktion bleibt möglich. Modulgrenzen werden durch Imports, Services und Tests erzwungen.
