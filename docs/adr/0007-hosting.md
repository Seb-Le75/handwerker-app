# ADR-0007: Hosting und Datenregion

- Status: accepted
- Datum: 2026-11-12

## Entscheidung

Next.js wird für den Start auf Vercel mit fest konfigurierter Function-Region Frankfurt (`fra1`) betrieben. PostgreSQL, Auth, Backups und private Ursprungsdateien liegen in einem Supabase-Projekt in der spezifischen AWS-Region Frankfurt (`eu-central-1`), nicht in der allgemeinen Region „Europe“.

## Grenzen und Exit

AVV/DPA und Unterauftragsverarbeiter werden vor Produktivdaten abgenommen. CDN-Caches und bestimmte betriebliche Verarbeitungen können außerhalb der gewählten Region stattfinden; sensible private Objekte werden nicht öffentlich über ein globales CDN ausgeliefert. Standard-PostgreSQL, SQL-Migrationen und S3-kompatible Exportpfade bleiben der Exit-Mechanismus.

Self-Hosting bleibt ohne benannte 24/7-Betriebsverantwortung ausgeschlossen.

Quellen: <https://supabase.com/docs/guides/platform/regions>, <https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq>, <https://vercel.com/docs/functions/configuring-functions/region>
