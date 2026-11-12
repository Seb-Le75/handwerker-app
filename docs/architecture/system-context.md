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

## Tenant-Kontext in Phase 1

Der Server bindet Datenbankzugriffe ausschließlich über `withTenantContext`:

1. Die authentifizierte Benutzer-ID und der gewünschte Tenant stammen aus der serverseitig validierten Session.
2. Eine Transaktion wechselt lokal in die nicht anmeldbare Rolle `handwerker_app`.
3. Tenant- und Benutzer-ID werden transaktionslokal gesetzt.
4. Unter aktiver RLS wird eine aktive Membership für genau dieses Paar verlangt.
5. Erst danach erhält der aufrufende Service die gebundene Drizzle-Transaktion.
6. Commit oder Rollback entfernt Rolle und Kontext automatisch.

Repositories erhalten deshalb keinen frei verwendbaren Tenant-Parameter und keine ungefilterte globale Datenbankverbindung. `users` ist bewusst eine globale Identitätstabelle; ihre RLS-Policies zeigen der App-Rolle nur die aktuelle Identität und aktive Mitglieder des gebundenen Tenants.
