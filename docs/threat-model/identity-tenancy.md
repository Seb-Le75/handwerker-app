# Threat Model – Identity und Tenancy

## Schutzgüter

Kunden-/Betriebsdaten, Sessions, Einladungen, Rollen, Audit-Events, Secrets und Verfügbarkeit.

| Bedrohung              | Prävention                                                  | Detektion                | Verifikation             |
| ---------------------- | ----------------------------------------------------------- | ------------------------ | ------------------------ |
| manipulierte Tenant-ID | Tenant aus Session/Membership, tenantgebundene Repositories | AuthZ-Metrik/Audit       | API-Negativtest          |
| Cross-Tenant-Query     | RLS, tenantkonsistente FKs, App-Rolle ohne Bypass           | DB-Fehler/Anomalie       | RLS-Integrationstest     |
| Sessiondiebstahl       | Secure/HttpOnly/SameSite, Rotation, kurze Lebensdauer, MFA  | Session-/Geo-Anomalien   | Cookie-/Widerrufstest    |
| Einladungsdiebstahl    | nur Tokenhash, Ablauf, Einmalnutzung                        | Fehlversuche/Rate Limit  | Replay-/Expiry-Test      |
| Rechteausweitung       | zentrale Permission Policies, Deny-by-default               | Audit Rollenänderung     | Rollenmatrix-Negativtest |
| letzter Admin entfernt | transaktionale Invariante                                   | abgewiesenes Audit Event | Concurrency-Test         |
| Audit-Manipulation     | append-only, DB-Rechte, getrennte Aufbewahrung              | Integritätsprüfung       | UPDATE/DELETE-DB-Test    |
| Account Enumeration    | generische Antworten, Rate Limit                            | Fehlerratenalarm         | Antwortvergleich         |
| Secret in Log          | strukturierte Redaction/Allowlist                           | Secret Scan              | Logging-Test             |
| Seed in Produktion     | Environment Guard                                           | Startfehler              | Production-Seed-Test     |

## Offene Risiken vor Phase 1

- Auth-Anbieter und konkrete MFA-/Recovery-Flows sind noch nicht entschieden.
- Supportzugriff bleibt deaktiviert, bis ein eigener Threat-Model-Nachtrag vorliegt.
- Hosting-/Subprocessor-Risiko wird im Anbieterentscheid bewertet.
