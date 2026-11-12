# ADR-0005: Rollenbasierte Autorisierung

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

Phase 1 nutzt feste Systemrollen mit expliziten Permissions: Inhaber/Admin, Büro/Disposition, Meister, Monteur, Buchhaltung und Nur-Lesen. Policies prüfen Permissions serverseitig. Die UI ist nie die einzige Schutzschicht.

Custom Roles werden erst ergänzt, wenn reale Anforderungen vorliegen. Ein Tenant darf nicht ohne aktiven Admin verbleiben.

## Folgen

Kleine, testbare Rollenmatrix zum Start. Jede neue Permission braucht positive und negative Policy-Tests.
