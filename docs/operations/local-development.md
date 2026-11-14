# Lokale Entwicklung

## Voraussetzungen

- Node.js gemäß `.nvmrc`
- npm gemäß `packageManager`
- Docker/Compose für PostgreSQL

## Start

```bash
npm ci --ignore-scripts
cp .env.example .env.local
npm run db:up
export DATABASE_URL='postgres://handwerker:handwerker_dev_only@127.0.0.1:5432/handwerker'
npm run db:migrate
npm run db:health
npm run db:seed
npm run test:integration
npm run dev
```

Die Zugangsdaten sind ausschließlich für die an `127.0.0.1` gebundene lokale Datenbank bestimmt.
Die Migration erzeugt außerdem die nicht anmeldbare Rolle `handwerker_app`. Dafür benötigt der lokale Migrationsbenutzer einmalig `CREATEROLE`; die laufende Anwendung verwendet diese Fähigkeit nicht.

`npm run db:seed` legt idempotent zwei strikt getrennte Demo-Betriebe sowie einen Benutzer mit zwei Memberships an. Die Auth-Subjects sind lokale Platzhalter; der Seed erzeugt ausdrücklich keine Passwörter. In `APP_ENV=production` oder `NODE_ENV=production` wird der Seed technisch verweigert.

## Qualitätsprüfung

```bash
npm run verify
npm run test:integration
npm run test:e2e
npm run security:secrets
```

## Migrationen

Angewandte SQL-Dateien dürfen nicht geändert werden. Der Runner vergleicht SHA-256-Checksummen. Änderungen erfolgen ausschließlich über eine neue, aufsteigend benannte Migration.

`drizzle-kit push` ist für gemeinsam genutzte Datenbanken verboten. Das Drizzle-Schema dient als typisierte Anwendungsrepräsentation; produktive Änderungen werden weiterhin als überprüfbare SQL-Migration eingecheckt.
