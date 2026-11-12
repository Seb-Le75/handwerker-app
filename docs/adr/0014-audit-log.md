# ADR-0014: Append-only Audit-Log

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

Privilegierte, sicherheitsrelevante und finanzielle Aktionen erzeugen tenantgebundene `audit_events`. Die App-Rolle darf Events anlegen und lesen, aber nicht ändern oder löschen. Actor, Aktion, Zielreferenz, Ergebnis, Zeit und redigierte Metadaten werden gespeichert.

Audit ist kein allgemeines Debug-Log und enthält keine Secrets, Tokens, Dokumentinhalte oder unnötige personenbezogene Daten.
