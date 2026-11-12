# Systemkontext und Vertrauensgrenzen

```text
[Browser/iPad]
      │ TLS, nicht vertrauenswürdige Eingaben
      ▼
[Next.js Server/BFF] ──► [Auth-Anbieter]
      │
      ├── tenantgebundene App-Rolle ──► [PostgreSQL + RLS]
      ├── kurzlebige signierte Rechte ─► [privater EU-Objektspeicher]
      └── Outbox/Job-Kontext ─────────► [Worker / E-Mail / PDF]
```

Vertrauensgrenzen:

1. Browserdaten, IDs, Rollenbehauptungen und Upload-Metadaten sind untrusted.
2. Authentifizierung beweist Identität, nicht fachliche Berechtigung.
3. Tenant-Kontext entsteht aus Session plus aktiver Membership.
4. Datenbank-RLS ist zweite Barriere hinter Application Policies.
5. Externe Anbieter erhalten nur die minimal erforderlichen Daten.
