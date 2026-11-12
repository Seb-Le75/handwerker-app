# Handwerker-App 2.0 – Freigabeplan für Phase 0 und Phase 1

**Stand:** 11. November 2026
**Status:** Zur fachlichen und technischen Freigabe – noch keine Produktimplementierung
**Grundlage:** `docs/HANDWERKER_APP_2_AUDIT_UND_IMPLEMENTIERUNGSPROMPT.md`

## 1. Verifizierte Bestandszusammenfassung

### Repository

- Aktiver Branch: `main`
- Ein vorhandener Commit: `eda2d34` (`erste Version handwerker App`)
- Nicht versionierte Änderung vor Beginn dieses Plans: das Audit unter `docs/`
- Keine `AGENTS.md` im Repository
- Next.js 15.1.3, React 19, TypeScript 5.7, Tailwind CSS 3.4
- 32 Dateien und ca. 3.219 Zeilen unter `src/`
- Keine API-Routen, Server Actions, Datenbankschemata, Migrationen oder Backenddienste
- Keine Authentifizierung, Rollen, Benutzer oder Mandanten
- Keine Testdateien, Testkonfiguration oder CI-Pipeline

### Funktionsumfang

Der Bestand ist ein clientseitiger SHK-Prototyp für:

- Kundenanlage und -bearbeitung
- lokale Auftragsliste
- geführte Auftragserfassung
- Material-, Werkzeug- und Wartungsauswahl
- Arbeitszeiten als einfache Uhrzeiten
- Fotos als Base64-Data-URLs
- Kundenunterschrift auf Canvas
- rechtliche Checkboxen und Abnahme
- Browserdruck einer Auftragsdetailseite

Alle Daten werden über `src/hooks/useLocalStorage.ts` im Browser gespeichert. Es gibt keine zentrale Synchronisation, serverseitige Integritätsprüfung, Autorisierung, Backups oder mandantenübergreifende Sicherheitsbarriere.

### Verifizierungsstatus

| Prüfung | Ergebnis |
|---|---|
| Quellcode-Inventar | Abgeschlossen |
| Git-Arbeitsbaum | Nur `docs/` ist neu/unversioniert |
| `npm run build` | Nicht ausführbar: `next: command not found` |
| `npm ci` | In eingeschränkter Umgebung ohne Abschluss/Ausgabe; Build nicht verifiziert |
| Typecheck | Mangels installierter Toolchain nicht ausgeführt |
| Lint | Mangels installierter Toolchain nicht ausgeführt |
| Tests | Nicht vorhanden |
| Datenmigration | Nicht erforderlich; keine Datenbank vorhanden |

### Konsequenz

Phase 0 muss zuerst eine reproduzierbare Entwicklungs- und Prüfgrundlage herstellen. Phase 1 darf erst beginnen, wenn Build, Typecheck, Lint und ein minimaler Testlauf lokal und in CI grün sind.

## 2. Offene fachliche Entscheidungen

Die folgenden Entscheidungen werden nicht durch technische Annahmen ersetzt. Die mit „Blockiert Phase 1“ markierten Punkte müssen vor dem jeweiligen Slice bestätigt werden.

| ID | Entscheidung | Empfehlung für den Start | Blockiert |
|---|---|---|---|
| F-01 | Erster Zielmarkt/Gewerk | Deutschland, zunächst SHK; Domänenkern dennoch konfigurierbar | spätere Fachmodule |
| F-02 | Mandantentyp | Ein rechtlich eigenständiger Betrieb je Tenant | Phase 1 |
| F-03 | Nutzer mit mehreren Betrieben | Unterstützen; aktive Mitgliedschaft explizit wählen | Phase 1 |
| F-04 | Initiale Rollen | Inhaber/Admin, Büro/Disposition, Meister, Monteur, Buchhaltung, Nur-Lesen | Phase 1 |
| F-05 | Individuelle Berechtigungen | Rollenbasierte Defaults; granulare Custom Roles erst später | Phase 1 |
| F-06 | Supportzugriff | Standardmäßig aus; nur zeitlich begrenzt, begründet und auditiert | Phase 1 |
| F-07 | Anmeldung | E-Mail + Passkey oder Passwort; MFA für Admins verpflichtend | Phase 1 |
| F-08 | Benutzerbereitstellung | Nur Einladung durch berechtigte Tenant-Admins; keine offene Registrierung | Phase 1 |
| F-09 | Datenresidenz | Primärdaten und private Dateien in konkreter EU-Region, bevorzugt Deutschland | Hosting-ADR |
| F-10 | Löschung von Benutzern | Mitgliedschaft deaktivieren; historische Urheberschaft pseudonymisiert erhalten | Phase 1 |
| F-11 | Audit-Aufbewahrung | Vorläufig 10 Jahre für finanz-/belegnahe Ereignisse, sonst konfigurierbare Policy; rechtlich bestätigen | Audit-Design |
| F-12 | Betriebslöschung | Mehrstufiger Export-, Sperr- und Löschworkflow mit Wartefrist | später, Schema jetzt |
| F-13 | Steuer-/Belegregeln | Keine Implementierung vor fachlicher/rechtlicher Bestätigung | Phase 4/6 |
| F-14 | Offline-Pflicht | Phase 1 online-first; Offline erst nach sicherem Kern | Phase 7 |
| F-15 | Bestandsdatenmigration | Kein automatischer Import in Phase 1; später optionaler lokaler Exporter | später |
| F-16 | RPO/RTO | Startziel RPO ≤ 1 h, RTO ≤ 4 h | Betriebs-ADR |

### Freigabeannahmen für Phase 1

Falls keine abweichende Vorgabe erfolgt, soll Phase 1 mit diesen fachlichen Grenzen geplant werden:

1. Keine öffentliche Selbstregistrierung.
2. Ein Benutzer darf mehreren Betrieben angehören, hat aber genau einen aktiven Tenant-Kontext pro Session/Request.
3. Ein Tenant-Admin darf Mitglieder einladen, Rollen zuweisen, Einladungen widerrufen und Mitgliedschaften deaktivieren.
4. Kein Benutzer darf seine letzte aktive Inhaber-/Admin-Berechtigung entfernen, wenn dadurch ein Betrieb ohne Administrator bliebe.
5. Support-Impersonation wird in Phase 1 nicht freigeschaltet; das Datenmodell verhindert keine spätere, streng auditierte Ergänzung.
6. Produktive Standardpasswörter oder Demo-Benutzer werden nicht erzeugt.

## 3. Vorgeschlagene ADR-Liste

Jede ADR wird vor der zugehörigen Implementierung angelegt. Der Status beginnt als `proposed` und wird erst nach Prüfung auf `accepted` gesetzt.

| ADR | Thema | Zu vergleichende Optionen | Entscheidungskriterium |
|---|---|---|---|
| ADR-0001 | Architekturform | modularer Monolith, Monorepo mit Diensten, Microservices | Komplexität, Isolation, Teamgröße |
| ADR-0002 | Node-/Paketmanagement | Node LTS + npm, pnpm, Corepack | Reproduzierbarkeit, CI, bestehendes Lockfile |
| ADR-0003 | Datenbank/ORM | PostgreSQL + Drizzle, PostgreSQL + Prisma | RLS-Transparenz, Migrationen, SQL-Kontrolle, DX |
| ADR-0004 | Authentifizierung | Auth.js/Library, Managed Auth, eigener Identity Provider | MFA/Passkeys, EU/DPA, Lock-in, sichere Sessions |
| ADR-0005 | Autorisierungsmodell | feste RBAC-Rollen, Permission Sets, Policy Engine | Prüfbarkeit, Tenant-Isolation, Erweiterbarkeit |
| ADR-0006 | Tenant-Isolation | Shared Schema + RLS, Schema je Tenant, DB je Tenant | Sicherheit, Kosten, Migration, Restore |
| ADR-0007 | Hosting | Vercel+EU-Dienste, EU-PaaS, Hyperscaler, Self-hosted | DPA, Region, Kosten, Betrieb, Exit |
| ADR-0008 | Objektstorage/Upload | S3-kompatibel, Supabase Storage, Cloud-spezifisch | Privatheit, EU-Region, signierte URLs, Scanpipeline |
| ADR-0009 | PDF-Erzeugung | Headless Chromium, React-PDF, externer Dienst | Layouttreue, Determinismus, Betrieb, Datenschutz |
| ADR-0010 | Background Jobs/Outbox | Postgres Queue, Managed Queue, Redis Queue | Zustellgarantie, Einfachheit, Monitoring |
| ADR-0011 | Observability | OpenTelemetry + Anbieter, integrierte Plattform | PII-Kontrolle, EU/DPA, Kosten, Portabilität |
| ADR-0012 | Teststrategie | Vitest/Jest, Playwright, DB-Testcontainer | Geschwindigkeit, Realitätsnähe, CI |
| ADR-0013 | Identifikatoren | UUIDv7, ULID, UUIDv4 | Sortierbarkeit, DB-Indizes, Portabilität |
| ADR-0014 | Audit-Log | Append-only Tabelle, Event Store, externer Auditdienst | Manipulationsschutz, Abfrage, Aufbewahrung |
| ADR-0015 | Migrations-/Rolloutstrategie | Expand-contract, Down-Migrations, Blue/green | Datenrisiko, Rollback, Verfügbarkeit |

### Empfohlene Reihenfolge

1. ADR-0001, 0002, 0007
2. ADR-0003, 0006, 0013, 0015
3. ADR-0004, 0005, 0014
4. ADR-0012, 0011
5. ADR-0008 bis 0010 vor den späteren Dokument-/Dateislices

## 4. Detaillierter Plan – Phase 0

### P0.1 Repository-Baseline

**Ziel:** Jeder Entwickler und die CI verwenden dieselbe unterstützte Toolchain.

Arbeiten:

- Node-LTS-Version nach Kompatibilitätsprüfung pinnen (`.nvmrc` und `package.json#engines`).
- Paketmanager und Lockfile verbindlich festlegen.
- Abhängigkeiten mit `npm ci` reproduzierbar installieren.
- veraltetes `next lint` durch direktes ESLint-Kommando ersetzen.
- Scripts für `format:check`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `build` definieren.
- bestehende Anwendung ohne fachliche Änderungen buildfähig machen.
- generierte Datei `tsconfig.tsbuildinfo` aus der Versionierung entfernen, falls sie getrackt ist, und ignorieren.

Akzeptanz:

- Frischer Checkout: ein dokumentierter Installationsbefehl, danach alle Baseline-Scripts erfolgreich.
- Lockfile bleibt bei wiederholtem Install unverändert.
- Keine globale Toolinstallation erforderlich.

### P0.2 Format-, Lint- und Testfundament

**Ziel:** Schnelle lokale Qualitätsprüfungen mit stabiler CI-Parität.

Arbeiten:

- ESLint Flat Config passend zur gewählten Next.js-Version.
- Prettier oder gleichwertige deterministische Formatprüfung ohne flächige Erstformatierung im selben Commit.
- Vitest mit DOM-Testumgebung und React Testing Library.
- Playwright mit mindestens Desktop Chromium und iPad-Profil.
- Separate Testkonfiguration für Datenbank-Integrationstests.
- Ein kleiner Characterization-Test für eine bestehende Kernfunktion, bevor Refactoring beginnt.

Akzeptanz:

- Ein absichtlich fehlerhafter Typ, Lintverstoß oder fehlschlagender Test stoppt die Pipeline.
- Testreports/Artefakte sind bei Fehlern verfügbar.

### P0.3 CI und Supply-Chain-Baseline

**Ziel:** Jeder Pull Request wird gleichartig geprüft.

Arbeiten:

- GitHub-Actions-Workflow mit Install, Formatcheck, Lint, Typecheck, Unit und Build.
- Integration/E2E als getrennte Jobs mit klaren Timeouts.
- Dependency-/Vulnerability-Scan und Secret Scan.
- Minimale Workflow-Berechtigungen, gepinnte Action-Major-Versionen oder Commit-SHAs nach Policy.
- Keine Produktionssecrets in PR-/Fork-Workflows.

Akzeptanz:

- CI läuft auf Pull Requests und `main`.
- Kein Deploy bei fehlgeschlagener Pflichtprüfung.
- Artefakte enthalten keine Secrets oder personenbezogene Daten.

### P0.4 Architektur- und Sicherheitsentscheidungen

**Ziel:** Phase 1 basiert auf bestätigten, nachvollziehbaren Entscheidungen.

Arbeiten:

- ADR-0001 bis ADR-0007 sowie ADR-0012 bis ADR-0015 bearbeiten.
- Systemkontext-, Container- und Trust-Boundary-Diagramm erstellen.
- STRIDE-orientiertes Threat Model für Login, Einladung, Tenant-Wechsel, Admin und Audit.
- Rollen-/Berechtigungsmatrix und Statusmodell für Einladungen/Mitgliedschaften erstellen.
- Datenklassifizierung und Logging-Redaction-Regeln dokumentieren.

Akzeptanz:

- Keine kritische Architekturentscheidung bleibt implizit.
- Jeder identifizierte P0/P1-Threat hat Prävention, Detektion und Test.

### P0.5 Lokale Infrastruktur und Betriebsvorbereitung

**Ziel:** PostgreSQL und abhängige Dienste sind lokal und in CI reproduzierbar.

Arbeiten:

- Lokalen PostgreSQL-Start über Compose oder projektkompatible Testcontainer definieren.
- `.env.example` ausschließlich mit Namen und sicheren Platzhaltern.
- zentrale validierte Server-/Client-Konfiguration; Server-Secrets können nicht in Client-Bundles gelangen.
- Migrations- und Seed-Kommandos definieren.
- Basis-Healthchecks und strukturierte Logkonvention festlegen.

Akzeptanz:

- Neue lokale Datenbank kann deterministisch migriert und mit nicht sensiblen Demo-Daten befüllt werden.
- Fehlende/ungültige Konfiguration stoppt den Start mit verständlicher Meldung.

### Phase-0-Gate

Phase 1 beginnt erst, wenn:

- alle Baseline-Scripts lokal und in CI grün sind,
- die grundlegenden ADRs akzeptiert sind,
- Rollenmatrix und Threat Model freigegeben sind,
- PostgreSQL-Migration und Testdatenbank reproduzierbar laufen,
- kein offener P0-Sicherheitsbefund besteht.

## 5. Detaillierter Plan – Phase 1

### P1.1 Tenancy-Datenmodell

Tabellen/Objekte:

- `tenants`
- `tenant_settings`
- `users`
- `memberships`
- `roles` und `permissions` oder bestätigte Alternative aus ADR-0005
- `invitations`
- `audit_events`

Regeln:

- Jede mandantenbezogene Tabelle besitzt `tenant_id`.
- Tenant-konsistente Unique Constraints und Foreign Keys.
- IDs gemäß ADR-0013; UTC-Timestamps; `version` für konkurrierende Änderungen.
- Mitgliedschaften werden deaktiviert, nicht historienlos gelöscht.
- Audit Events sind append-only und enthalten Actor, Tenant, Aktion, Zielreferenz, Zeitpunkt und sichere Metadaten.

### P1.2 Tenant-Kontext und RLS

- Tenant-Kontext wird aus authentifizierter Session und aktiver Mitgliedschaft bestimmt.
- Kein Repository akzeptiert eine frei verwendbare Tenant-ID ohne gebundenen Kontext.
- RLS-Policies für Lesen, Anlegen, Ändern und Löschen jeder Tenant-Tabelle.
- DB-Rolle der Anwendung darf RLS nicht umgehen.
- Hintergrundjobs erhalten einen signierten/validierten Tenant-Kontext und öffnen keine globale Datenansicht.
- Tenant-Wechsel validiert Mitgliedschaft und erzeugt ein Audit Event.

### P1.3 Authentifizierung

- Auth-Anbieter/Library gemäß ADR-0004 integrieren.
- Secure/HttpOnly/SameSite Cookies; Session-Rotation und Widerruf.
- Login, Logout, Session-Ablauf und sichere Recovery.
- MFA-Fähigkeit; Admin-MFA nach bestätigter Policy erzwingen.
- Login- und Recovery-Endpunkte mit Rate Limits und generischen Fehlern gegen Account Enumeration.
- Keine Tokens oder Passwörter in Logs.

### P1.4 Autorisierung

- Berechtigungen nicht in UI-Komponenten erfinden, sondern zentrale Policies nutzen.
- Start-Permissions z. B. `tenant.read`, `tenant.update`, `members.read`, `members.invite`, `members.role.assign`, `audit.read`.
- Serverseitige Durchsetzung für jede Mutation und Abfrage.
- UI blendet unzulässige Aktionen aus, bleibt aber nie einzige Schutzschicht.
- Schutz vor Entfernung des letzten Tenant-Admins.

### P1.5 Einladungen und Mitgliederverwaltung

- Tenant-Admin lädt per E-Mail ein; Token nur gehasht speichern, Ablauf und Einmalnutzung.
- Einladungen widerrufen und erneut senden mit Rate Limit.
- Annahme verknüpft bestehenden oder neuen Benutzer sicher mit dem richtigen Tenant.
- Rollenwechsel und Deaktivierung mit Audit Event.
- Minimaler Office-Adminbereich für Betriebsprofil, Mitglieder und offene Einladungen.

### P1.6 Audit und Observability

- Append-only Audit-Service innerhalb derselben Transaktion oder über zuverlässige Outbox.
- Korrelation-ID für Requests und Jobs.
- Redaction-Tests für Session, Token, E-Mail-Inhalte und Secrets.
- Metriken für Loginfehler, Einladungsmissbrauch, Autorisierungsfehler und Tenant-Wechsel.
- Admin-Auditansicht nur mit `audit.read`, paginiert und tenantgebunden.

### P1.7 Seed und lokale Demo

- Zwei Demo-Tenants mit unterschiedlichen Benutzern und Rollen.
- Seeds nur außerhalb Production ausführbar.
- Keine produktiven Standardpasswörter; lokale Zugangsdaten werden zur Laufzeit generiert oder ausdrücklich nur lokal dokumentiert.
- Seed-Daten erlauben automatisierte negative Cross-Tenant-Tests.

### Phase-1-Gate

Phase 1 ist abgeschlossen, wenn:

- zwei Tenants weder über UI, API noch direkte App-DB-Rolle gegenseitige Daten lesen oder verändern können,
- alle AuthN-/AuthZ-/RLS-Negativtests grün sind,
- Einladung, Annahme, Rollenwechsel, Tenant-Wechsel und Deaktivierung auditiert werden,
- der letzte Admin technisch geschützt ist,
- Session-/Token-/Secret-Daten nicht in Logs erscheinen,
- Kernwege auf Desktop und iPad-Profil E2E-getestet sind,
- CI, Build und Migrationen grün sind und kein P0/P1-Befund offen bleibt.

## 6. Beabsichtigte Änderungen und Dateien

Die Dateiliste ist ein Plan, kein Versprechen für exakt dieselbe Benennung. Abweichungen werden in ADR oder Implementierungsnotiz begründet.

### Phase 0 – voraussichtlich neu

```text
.nvmrc
.env.example
eslint.config.mjs
prettier.config.mjs
vitest.config.ts
playwright.config.ts
compose.yaml
.github/workflows/ci.yml
tests/setup.ts
tests/unit/baseline.test.ts
tests/e2e/smoke.spec.ts
docs/adr/README.md
docs/adr/0001-architecture.md
docs/adr/0002-toolchain.md
docs/adr/0003-database-orm.md
docs/adr/0004-authentication.md
docs/adr/0005-authorization.md
docs/adr/0006-tenant-isolation.md
docs/adr/0007-hosting.md
docs/adr/0012-testing.md
docs/adr/0013-identifiers.md
docs/adr/0014-audit-log.md
docs/adr/0015-migrations-rollout.md
docs/threat-model/identity-tenancy.md
docs/architecture/system-context.md
docs/architecture/roles-permissions.md
docs/operations/local-development.md
src/lib/env/server.ts
src/lib/env/client.ts
```

### Phase 0 – voraussichtlich geändert

```text
package.json
package-lock.json
.gitignore
README.md
tsconfig.json
next.config.ts
```

### Phase 1 – voraussichtlich neu

```text
db/schema/identity.ts
db/schema/tenancy.ts
db/schema/audit.ts
db/schema/index.ts
db/migrations/<timestamp>_identity_tenancy.sql
db/seed.ts
src/modules/identity/domain/*
src/modules/identity/application/*
src/modules/identity/infrastructure/*
src/modules/tenancy/domain/*
src/modules/tenancy/application/*
src/modules/tenancy/infrastructure/*
src/modules/audit/application/*
src/modules/audit/infrastructure/*
src/lib/auth/session.ts
src/lib/auth/guards.ts
src/lib/db/client.ts
src/lib/db/tenant-context.ts
src/lib/http/problem.ts
src/app/(auth)/login/page.tsx
src/app/(auth)/invite/[token]/page.tsx
src/app/(office)/layout.tsx
src/app/(office)/admin/organization/page.tsx
src/app/(office)/admin/members/page.tsx
src/app/(office)/admin/audit/page.tsx
src/app/api/auth/*
src/app/api/invitations/*
src/app/api/members/*
src/app/api/tenant-switch/route.ts
tests/integration/tenancy/*
tests/integration/auth/*
tests/integration/audit/*
tests/e2e/auth.spec.ts
tests/e2e/tenant-isolation.spec.ts
tests/e2e/member-admin.spec.ts
```

Bestehende MVP-Seiten bleiben während Phase 0 erreichbar. In Phase 1 wird explizit entschieden, ob sie vorübergehend hinter Auth liegen oder unter einem klar bezeichneten Demo-Pfad weiterlaufen. Sie werden nicht ungeprüft an das neue ORM angeschlossen.

## 7. Test- und Abnahmematrix

### Baseline

| ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| B-01 | Install | Frischer Checkout + Lockfile-Install | deterministisch, Lockfile unverändert |
| B-02 | Static | Typecheck | keine Fehler |
| B-03 | Static | Lint/Formatcheck | keine Pflichtverstöße |
| B-04 | Unit | Test-Suite | grün, Report erzeugt |
| B-05 | Build | Production Build | erfolgreich ohne globale Tools |
| B-06 | E2E | Startseite Desktop/iPad | lädt ohne Console-/Runtime-Fehler |
| B-07 | Config | Pflichtvariable fehlt | Start schlägt sicher und verständlich fehl |
| B-08 | Supply Chain | Secret-/Dependency-Scan | keine kritischen offenen Befunde |

### Datenbank und Migration

| ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| D-01 | Integration | Leere DB migrieren | vollständig erfolgreich |
| D-02 | Integration | Migration erneut/Upgradepfad | definierter, nicht destruktiver Zustand |
| D-03 | Integration | Seed in Test/Dev | zwei getrennte Demo-Tenants |
| D-04 | Integration | Seed in Production | technisch verweigert |
| D-05 | DB | Ungültige tenantübergreifende FK | DB lehnt ab |
| D-06 | DB | Duplicate Membership/Role Constraint | DB lehnt kontrolliert ab |

### Authentifizierung und Session

| ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| A-01 | Integration/E2E | Gültiger Login | sichere Session, korrekte Weiterleitung |
| A-02 | Integration | Falsches Passwort/Account unbekannt | generische gleiche Fehlermeldung |
| A-03 | Integration | Abgelaufene/widerrufene Session | Zugriff verweigert |
| A-04 | Security | Cookieattribute in Production | Secure, HttpOnly, passende SameSite-Policy |
| A-05 | Security | Wiederverwendung/Rotation | alte Session oder Token ungültig |
| A-06 | Security | Brute Force | Rate Limit greift, Ereignis messbar |
| A-07 | Logging | Login/Recovery | kein Passwort, Token oder Cookie im Log |

### Tenant-Isolation

| ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| T-01 | Service | Tenant A liest ID aus Tenant B | Not found/forbidden ohne Datenleck |
| T-02 | Service | Tenant A ändert/löscht B | verweigert, keine Zeile verändert |
| T-03 | DB/RLS | direkte Query mit App-Rolle auf B | null/permission denied |
| T-04 | API | manipulierte `tenantId` im Body/Query | ignoriert oder validiert und verweigert |
| T-05 | Cache | gleiche Objekt-ID in A und B | getrennte Cache Keys/Antworten |
| T-06 | Job | Job-Payload mit falschem Tenant | verweigert, Fehler auditiert |
| T-07 | E2E | Tenant-Wechsel mit Mitgliedschaft | Kontext wechselt, Datenansicht vollständig getrennt |
| T-08 | E2E | Tenant-Wechsel ohne Mitgliedschaft | verweigert |

### Autorisierung

| ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| R-01 | Policy | Admin lädt Mitglied ein | erlaubt und auditiert |
| R-02 | Policy | Monteur lädt Mitglied ein | serverseitig verweigert |
| R-03 | Policy | Buchhaltung liest Audit ohne Recht | verweigert |
| R-04 | Policy | Rollenänderung durch berechtigten Admin | erlaubt und auditiert |
| R-05 | Policy | Letzten Admin deaktivieren/herabstufen | verweigert |
| R-06 | UI/E2E | Aktion ohne Berechtigung | nicht angeboten; direkter API-Aufruf dennoch verweigert |

### Einladung und Mitgliedschaft

| ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| I-01 | Integration | Einladung erstellen | gehashtes Token, Ablauf, Audit Event |
| I-02 | Integration | gültige Einladung einmal annehmen | Membership entsteht einmal |
| I-03 | Security | Token zweimal verwenden | zweiter Versuch verweigert |
| I-04 | Security | abgelaufenes/widerrufenes Token | verweigert ohne Informationsleck |
| I-05 | Integration | bestehender Nutzer nimmt Einladung an | sichere Zuordnung, keine Doppelidentität |
| I-06 | Security | Einladungs-Spam | Rate Limit und Audit/Metric |

### Audit und Datenschutz

| ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| L-01 | Integration | privilegierte Mutation | vollständiges tenantgebundenes Audit Event |
| L-02 | DB | Audit Event ändern/löschen mit App-Rolle | verweigert |
| L-03 | Security | sensible Eingabefelder | redigiert/nicht gespeichert |
| L-04 | API | Audit-Pagination/Filter | tenantgebunden, stabil sortiert |
| L-05 | Authorization | Audit lesen ohne `audit.read` | verweigert |

### UX und Barrierefreiheit

| ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| U-01 | E2E | Login per Tastatur | vollständiger Fokusweg, sichtbarer Fokus |
| U-02 | E2E | Mitgliederverwaltung Desktop | effizient und ohne horizontale Kernnavigation |
| U-03 | E2E | Mitgliederverwaltung iPad | Touch-Ziele und Dialoge nutzbar |
| U-04 | A11y | automatischer WCAG-Scan Kernseiten | keine kritischen Verstöße |
| U-05 | UX | Session abgelaufen | verständliche Meldung, keine stille Datenmutation |
| U-06 | UX | Server-/Netzfehler | sichere Wiederholung, kein doppelter Datensatz |

## 8. Freigabeentscheidung

Mit der Freigabe dieses Dokuments werden ausschließlich folgende Arbeiten autorisiert:

1. Phase 0 vollständig umzusetzen.
2. Die ADRs als Vorschläge auszuarbeiten und grundlegende Technologieentscheidungen sichtbar zu machen.
3. Nach erfolgreichem Phase-0-Gate Phase 1 gemäß diesem Plan umzusetzen, soweit die als blockierend markierten Fachentscheidungen bestätigt sind.

Nicht umfasst sind Produktivdeployment, Beschaffung kostenpflichtiger Dienste, Verarbeitung echter Kundendaten, Versand realer E-Mails, DNS-Änderungen oder die späteren Fachphasen 2 bis 7.
