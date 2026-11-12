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
npm run dev
```

Die Zugangsdaten sind ausschließlich für die an `127.0.0.1` gebundene lokale Datenbank bestimmt.

## Qualitätsprüfung

```bash
npm run verify
npm run test:integration
npm run test:e2e
npm run security:secrets
```

## Migrationen

Angewandte SQL-Dateien dürfen nicht geändert werden. Der Runner vergleicht SHA-256-Checksummen. Änderungen erfolgen ausschließlich über eine neue, aufsteigend benannte Migration.
