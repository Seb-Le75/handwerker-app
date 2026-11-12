# ADR-0015: Expand–Migrate–Contract

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

Datenbankänderungen werden vorwärtskompatibel ausgerollt: zuerst additive Struktur, dann Datenmigration, dann Codeumschaltung und erst in einem späteren Release Entfernung. Bereits angewandte Migrationen sind unveränderlich und per SHA-256 geschützt.

Down-Migrationen sind kein Standard-Rollback für Daten. Anwendungscode muss während kontrollierter Rollouts mit alter und neuer Struktur kompatibel sein.
