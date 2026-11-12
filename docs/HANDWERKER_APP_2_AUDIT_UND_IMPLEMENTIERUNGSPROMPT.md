# Handwerker-App 2.0

## Produktanalyse, Gesamtaudit, Zielarchitektur und ausführbarer Implementierungsprompt

**Stand:** 11. November 2026
**Analysiertes Repository:** `Handwerker-App`
**Bestand:** Version 1.0.0, Commit `eda2d34` („erste Version handwerker App“)
**Umfang:** 32 Quelldateien, ca. 3.219 Zeilen in `src/`

> Hinweis zum Auftrag: Der bereitgestellte Master-Prompt endet nach Abschnitt 9 mitten in der Überschrift „10. i“. Dieses Dokument bearbeitet alle vollständig übermittelten Anforderungen. Es implementiert Version 2.0 ausdrücklich noch nicht.

---

## 1. Management Summary

Die bestehende Anwendung ist ein brauchbarer, visuell konsistenter **Frontend-Prototyp für die Vor-Ort-Erfassung eines SHK-Einsatzes**. Sie ist keine produktionsfähige Betriebssoftware und keine SaaS-Plattform. Alle fachlichen Daten einschließlich Kundendaten, Fotos und Unterschriften liegen unverschlüsselt im Browser-`localStorage` des jeweiligen Geräts. Backend, Datenbank, Anmeldung, Benutzer- und Rechteverwaltung, Mandantentrennung, echte Dokumentengenerierung, E-Mail-Versand, Backups, Überwachung und Tests fehlen.

Die App unterstützt heute einen Ausschnitt des Prozesses:

`Kunde auswählen/anlegen → Einsatzart → rechtliche Checkboxen + Unterschrift → Auftragsdetails/Fotos → Arbeitszeit/Material/Werkzeug → Abnahme → lokale Speicherung/Browserdruck`

Der angestrebte End-to-End-Prozess wird dagegen nicht unterstützt:

`Anfrage → Qualifizierung → Angebot → Freigabe → Planung/Disposition → Durchführung → Arbeitsnachweis/Abnahme → Rechnung → Zahlung/Mahnung → Archivierung/Auswertung`

### Gesamturteil

| Bereich | Reifegrad | Urteil |
|---|---:|---|
| Vor-Ort-UX | 2/5 | Gute Grundlage, aber noch kein robuster iPad-Arbeitsmodus |
| Büroprozesse | 1/5 | Nur Dashboard, Kundenliste und Auftragsliste als Prototyp |
| Fachlicher End-to-End-Prozess | 1/5 | Angebot, Planung, Rechnung und Zahlung fehlen |
| Architektur | 1/5 | Rein clientseitig; für SaaS nicht übernehmbar |
| Sicherheit/DSGVO | 0/5 | Für echte personenbezogene Daten nicht freigabefähig |
| Betrieb/Deployment | 1/5 | Next.js-Grundgerüst vorhanden, Betriebsfähigkeit nicht nachgewiesen |
| Tests/Wartbarkeit | 1/5 | Kleine, lesbare Codebasis, aber keine automatisierten Tests |

### Strategische Empfehlung

Version 2.0 sollte als **modularer Monolith** mit einer gemeinsamen Next.js-/TypeScript-Codebasis, PostgreSQL, ORM, serverseitiger Authentifizierung, S3-kompatiblem Objektspeicher und asynchronem Job-Runner entstehen. Keine Microservices zum Start. Die vorhandene UI kann als fachlicher Prototyp und visuelle Referenz dienen; Datenhaltung, Domänenmodell und Geschäftslogik müssen neu aufgebaut werden.

---

## 2. Produktverständnis und Nutzergruppen

### 2.1 Produktziel

Die Handwerker-App 2.0 ist das operative System eines kleinen oder mittleren Handwerksbetriebs. Sie verbindet Büro und Baustelle auf einem konsistenten Datenbestand und führt jeden Vorgang von der ersten Anfrage bis zum kaufmännischen Abschluss.

### 2.2 Primäre Nutzerrollen

| Rolle | Hauptaufgaben | Geräteprofil |
|---|---|---|
| Betriebsinhaber/Admin | Betrieb konfigurieren, Benutzer, Kennzahlen, Freigaben | Desktop, gelegentlich Tablet |
| Büro/Disposition | Anfragen, Kunden, Angebote, Termine, Aufträge, Rechnungen, Wiedervorlagen | Desktop/Webbrowser |
| Meister/Projektleitung | Kalkulation, Freigaben, Planung, Qualitätskontrolle | Desktop + iPad |
| Monteur | Tagesaufträge, Zeiten, Material, Fotos, Arbeitsnachweis, Unterschrift | iPad zuerst, Smartphone ergänzend |
| Buchhaltung | Rechnungen, Zahlstatus, Export, Mahnungen | Desktop |
| Externer Kunde | Angebotsfreigabe, Dokumente, optional Portal | Smartphone/Desktop; spätere Phase |

### 2.3 Gerätespezifische UX

Ein gemeinsames Designsystem soll zwei Arbeitsflächen erzeugen:

- **Field Workspace (iPad):** große Touch-Ziele, Tagesliste, schneller Kontextwechsel, Autosave, Offline-/Verbindungsstatus, Kamera, Signatur, schrittweiser Abschluss, möglichst wenig Tabellen.
- **Office Workspace (Desktop):** Sidebar, dichte Tabellen, gespeicherte Filter, Mehrfachaktionen, Split-Views, Tastaturbedienung, Auswertungen und parallele Informationsdarstellung.
- **Smartphone:** kompakte Tagesliste, Navigation, Zeiterfassung, Foto-Upload, Statusänderung und Kontaktdaten; keine verkleinerte Desktop-Tabelle.

---

## 3. Funktionsinventar des Bestands

### 3.1 Vorhanden und für den Prototyp gut umgesetzt

| Funktion | Nachweis | Bewertung |
|---|---|---|
| Responsive App-Shell und Navigation | `src/components/AppShell.tsx` | Klar, kleine Navigation, sinnvolle Touch-Höhen |
| Geführte Auftragserfassung | `src/components/JobWizard.tsx` | Acht nachvollziehbare Schritte |
| Kundenanlage und -bearbeitung | `CustomerForm.tsx`, `app/customers/page.tsx` | Für MVP verständlich und direkt |
| Material-/Werkzeugauswahl | `JobWizard.tsx`, `app/settings/page.tsx` | Katalogbasierte Auswahl und einfache Summen |
| Fotoaufnahme/-auswahl | `PhotoUploader.tsx` | Nutzt mobilen Dateidialog, mehrere Bilder |
| Unterschrift per Touch/Pencil | `SignaturePad.tsx` | Pointer Events und hochauflösendes Canvas |
| Wartungsprüfpunkte | `JobWizard.tsx`, `data/mock.ts` | Konfigurierbare Auswahl für Wartungsfälle |
| Abnahmeerfassung | `AcceptanceStep.tsx` | Grundlegende fachliche Zustände vorhanden |
| Druckansicht eines Auftrags | `app/jobs/[id]/page.tsx` | Browserdruck als Demo zweckmäßig |
| Konsistentes UI-System | `components/ui/*`, `globals.css` | Kleine wiederverwendbare Komponentenbasis |

### 3.2 Vorhanden, aber verbesserungsbedürftig

| Funktion | Problem | Soll |
|---|---|---|
| Dashboard | Nur drei Zähler und letzte Aufträge | Rollenbezogene KPIs, Aufgaben, Termine, fällige Angebote/Rechnungen |
| Kundenverwaltung | Nur natürliche Person, eine Freitextadresse, keine Kontakte/Standorte | Kunde/Firma, mehrere Ansprechpartner, Rechnungs-/Einsatzadressen, Historie |
| Auftragsstatus | Nur Entwurf/Offen/Abgeschlossen/Abgebrochen | Definierter Statusautomat mit Freigabe- und Terminstatus |
| Arbeitszeit | Nur Uhrzeit ohne Datum, Pause oder Mitarbeiterzuordnung | Zeitbuchungen mit Datum, Person, Pausen, Freigabe und Korrekturprotokoll |
| Preise/Kalkulation | Nur einfache Material-/Werkzeugsummen | Netto/Brutto, MwSt., Lohn, Rabatte, Zuschläge, EK/VK, Deckungsbeitrag |
| Rechtliche Bestätigung | Checkboxen und eine Signatur ohne Dokumentversion | Versionierte Texte, Nachweiszeitpunkt, Unterzeichner, Hash und PDF-Artefakt |
| PDF | Button ruft nur `window.print()` auf | Deterministisches serverseitiges PDF mit unveränderlichem Snapshot |
| Responsive Materialtabellen | Horizontales Scrollen ab 760/860 px | iPad-Karten/Zeileneditor und Desktop-Tabelle getrennt |
| Einstellungen | Jeder lokale Nutzer kann alle Kataloge ändern | Rollen, Freigaben, Versionierung und serverseitige Validierung |
| Fehlerbehandlung | `localStorage`-Parsing kann die App brechen | Fehlergrenzen, validierte Daten, Recovery und Nutzerfeedback |

### 3.3 Nur teilweise implementiert

- Kundenstammdaten und Auftragshistorie
- Auftragsanlage und Einsatzdokumentation
- Material-/Werkzeugkatalog
- Wartungschecklisten
- Rechtliche Hinweise
- Arbeitsnachweis und Abnahme
- Foto-/Dokumentanhänge
- Dashboard und einfache Kennzahlen
- Betriebsprofil (nur statischer Text)
- Dokumente (nur drei statische Hinweisseiten)

### 3.4 Für das Produktziel fehlend

- Anfrage-/Lead-Erfassung und Kommunikation
- Angebotsmodul mit Versionen, Positionen, Freigabe und Gültigkeit
- Auftragsumwandlung aus Angebot
- Terminplanung, Kalender, Disposition und Mitarbeiterzuweisung
- Vollständige Leistungs-, Artikel-, Material- und Stücklistenkataloge
- Rechnung, Teil-/Abschlags-/Schlussrechnung, Gutschrift, Storno
- Zahlungsstatus, Mahnwesen und Buchhaltungsexport
- Aufgaben, Wiedervorlagen, Benachrichtigungen
- Dokumentvorlagen, Nummernkreise, Branding und PDF-Archiv
- E-Mail-Versand mit Versandprotokoll
- Benutzer, Rollen, Teams und Berechtigungen
- Anmeldung, Passwort-/Passkey-/MFA-Prozesse
- Mandantenfähigkeit
- Serverseitige API und Geschäftslogik
- Relationale Datenbank
- Objektspeicher und sichere Upload-Pipeline
- Suche, Filter, Pagination, Exporte und Auswertungen
- Audit-Log, Datenschutzexport und Löschworkflow
- Backup, Restore, Monitoring und Alarmierung
- Offlinefähige Entwürfe/Synchronisation für Vor-Ort-Arbeit
- Testautomatisierung und CI/CD

### 3.5 Optional für spätere Versionen

- Kundenportal mit Angebotsfreigabe und Dokumentdownload
- Lieferanten- und Bestellwesen
- Lagerverwaltung/Bestandsführung/Barcode
- DATEV-, ZUGFeRD-/XRechnung- und Banking-Integration
- Routenoptimierung und GPS-gestützte Disposition (nur mit strenger Datenschutzprüfung)
- Wiederkehrende Wartungsverträge
- Digitale Zeiterfassung mit tariflichen Regeln
- KI-gestützte Texterstellung, Fotoanalyse oder Belegerkennung mit expliziter Governance
- Native Push-Benachrichtigungen/PWA-Installation

### 3.6 Unnötig oder redundant

- `JobType = "Angebot"` vermischt Dokument-/Prozessart mit Auftragstyp. Ein Angebot ist ein eigenes, versioniertes Geschäftsobjekt.
- Werkzeugkosten sollten konfigurierbare Leistungs-/Kostenpositionen sein; ein eigener paralleler Mini-Katalog ist nur sinnvoll, wenn fachlich wirklich getrennt berichtet wird.
- Rechtliche Einwilligung, Widerrufsbelehrung, Auftragserteilung und Abnahme dürfen nicht als eine einzige Signatur/Checkbox-Gruppe modelliert werden.
- Leere, vorab erzeugte Katalogzeilen in `mock.ts` sind für eine serverseitige Anwendung unnötig.

---

## 4. Prozessanalyse

### 4.1 Ist-Prozess

```text
lokale Mock-/Kundendaten
        │
        ▼
Kunde wählen/anlegen
        ▼
Einsatzart wählen
        ▼
Hinweise bestätigen + unterschreiben
        ▼
Beschreibung/Fotos/Zeiten/Material erfassen
        ▼
Abnahme markieren
        ▼
im Browser speichern ──► Auftragsliste ──► Browserdruck
```

Die App besteht aus einem zusammenhängenden **Erfassungswizard**, nicht aus einem durchgängigen kaufmännischen Geschäftsprozess. Beziehungen existieren nur zwischen `Customer` und `Job`; Materialien, Werkzeuge und Wartungsprüfungen werden beim Speichern als Kopie in den Auftrag eingebettet. Angebote, Rechnungen und echte Dokumente existieren nicht.

### 4.2 Zielprozess

```text
Anfrage
  ├─► Kunde + Ansprechpartner + Standort
  ├─► Aufgabe/Wiedervorlage
  └─► Angebot v1..n ──► versendet ──► angenommen/abgelehnt
                               │
                               ▼
                         Auftrag angelegt
                               │
                  Planung ─► Termin ─► Mitarbeiter
                               │
                               ▼
                       mobiler Arbeitseinsatz
                 Zeiten + Material + Fotos + Checkliste
                               │
                               ▼
                  Arbeitsnachweis + Abnahme + Signatur
                               │
                               ▼
                   Rechnung/Abschlag/Schlussrechnung
                               │
                      versendet ─► bezahlt/gemahnt
                               │
                               ▼
                        Archiv + Auswertung
```

Jede Umwandlung muss nachvollziehbar sein. Preise und Texte werden als versionierte Snapshots übernommen; spätere Katalogänderungen dürfen historische Angebote oder Rechnungen nicht verändern.

---

## 5. Technisches Audit

### 5.1 Architektur und Datenhaltung

**Kritisch:** `src/hooks/useLocalStorage.ts:8-24` ist die gesamte Persistenzschicht. Es gibt keine API-Routen, Server Actions, Datenbankmodelle oder serverseitige Validierung. Jeder Nutzer kann Daten in den Browser-Entwicklertools verändern. Daten sind geräte- und browsergebunden, nicht synchronisiert und nicht zuverlässig sicherbar.

**Folgen:**

- Datenverlust beim Löschen von Browserdaten oder Gerätewechsel
- Keine parallele Büro-/Außendienstnutzung
- Keine Konfliktbehandlung
- Keine verbindliche Integrität oder Transaktion
- Keine zentrale Aktualität
- Keine Rechteprüfung und kein Audit-Trail
- `localStorage`-Quota wird durch Base64-Fotos/Signaturen schnell ausgeschöpft

### 5.2 Next.js, React und TypeScript

Positiv:

- App Router und striktes TypeScript sind konfiguriert.
- Komponenten sind klein bis mittelgroß und grundsätzlich lesbar.
- UI-Basiskomponenten sind wiederverwendbar.
- Client-Komponenten werden bewusst markiert.

Probleme:

1. Fast die gesamte fachliche Anwendung läuft im Client. Next.js-Serverfähigkeiten werden nicht genutzt.
2. `JobWizard.tsx` hat rund 700 Zeilen und vereint Navigation, Validierung, Kataloglogik, Berechnung, Persistenz und Rendering.
3. Formulare haben keine gemeinsame Schema-Validierung; TypeScript-Typen schützen keine Laufzeitdaten.
4. Geldwerte werden als JavaScript-`number` gespeichert. Für kaufmännische Daten sind Integer-Cents oder DB-Decimal mit klarer Rundungsstrategie erforderlich.
5. Datums-/Zeitmodell ist unzureichend: `startTime`/`endTime` sind Strings ohne Datum, Zeitzone, Pause oder Übernachtfälle.
6. Die Statuslogik setzt einen Auftrag allein wegen `customerConfirmed` auf „Abgeschlossen“ (`JobWizard.tsx:125-133`).
7. Abgebrochene Aufträge können unvollständige oder unpassende Daten persistieren (`JobWizard.tsx:136-145`).
8. Die Validierung prüft nur Kunde und Rechtsschritt; alle anderen Schritte sind immer gültig (`JobWizard.tsx:691-705`).
9. `SignaturePad.tsx:17-42` führt den Effekt nach jedem Render aus, skaliert das Canvas wiederholt und kann beim Rendern/Resize Zeichnungen zurücksetzen.
10. Dashboard-Links führen für jeden Eintrag nur nach `/jobs` statt direkt zum Auftrag (`Dashboard.tsx:62-64`).

### 5.3 Backend/API

Nicht vorhanden. Es fehlen:

- definierte API-Grenzen
- Authentifizierungs- und Autorisierungsmiddleware
- Eingabevalidierung
- idempotente Mutationen
- Transaktionen
- Concurrency Control/Versionsspalten
- Rate Limiting
- standardisierte Fehlerantworten
- Background Jobs

### 5.4 Datenmodell

Das Modell in `src/types/index.ts` ist ein UI-Datenmodell, kein belastbares Geschäftsmodell.

Konkrete Lücken:

- Keine `tenantId`/`organizationId`
- Kein Benutzer/Mitarbeiter und keine Rollen
- Kunde kann weder Firma noch mehrere Kontakte/Standorte abbilden
- Auftrag hat keine Nummer, kein Datum, keine Adresse als Snapshot, keinen Verantwortlichen und keinen Termin
- Angebots-, Rechnungs-, Zahlungs- und Dokumententitäten fehlen
- Preise enthalten keine Steuer, Währung, Rabatte, Kostenbasis oder Preisgültigkeit
- Fotos sind Data-URLs statt Objektmetadaten
- Keine Versionierung, Soft-Delete- oder Audit-Felder
- `technicianRoles` speichert Rollen statt tatsächlicher Mitarbeiter
- Statuswerte bilden keinen zulässigen Übergangsgraphen ab

### 5.5 Dokumente und PDF

`app/jobs/[id]/page.tsx:111-114` bezeichnet `window.print()` als „PDF erstellen“. Das ist keine kontrollierte PDF-Erstellung. Ergebnis und Seitenumbruch hängen von Browser, Gerät und Druckdialog ab; Dokument-ID, Version, Hash, Erstellzeitpunkt und Archivobjekt fehlen.

Die statischen Rechtstexte enthalten selbst den Hinweis, dass sie rechtlich geprüft werden müssen (`documents/widerruf/page.tsx:22-24`). Vor Produktion ist eine anwaltliche Prüfung und versionierte Mandantenkonfiguration erforderlich.

### 5.6 Datei-Uploads

`PhotoUploader.tsx:17-33` liest beliebige `image/*`-Dateien vollständig als Data-URL ein. Es fehlen:

- Größen- und Anzahlbegrenzung
- echte MIME-/Magic-Byte-Prüfung
- Bilddecodierung/Re-Encoding
- Metadaten-/EXIF-Behandlung
- Malwareprüfung
- private Objektspeicherung
- kurzlebige signierte URLs
- Uploadstatus, Retry und Abbruch
- serverseitige Zuordnung und Rechteprüfung

### 5.7 Performance

- Alle Daten werden vollständig aus `localStorage` geladen und bei jeder Änderung vollständig serialisiert.
- Base64 vergrößert Binärdaten und blockiert den Hauptthread.
- Listen haben keine Pagination oder Virtualisierung.
- Katalogsuche fehlt; bei realistischen Artikelmengen wird der Wizard unbedienbar.
- Keine Bildkomprimierung/Thumbnails.
- Keine serverseitigen Caches oder Query-Indizes.

### 5.8 Responsive Design und Barrierefreiheit

Positiv sind große Bedienelemente, sichtbare Labels und responsive Grids. Kritische Tabellen werden jedoch nur horizontal scrollbar gemacht. Es fehlen ein systematischer WCAG-Test, Statusmeldungen, Fokusmanagement beim Wizardwechsel, Fehlerzusammenfassungen und eine Kennzeichnung des aktiven Navigationslinks mittels `aria-current`.

`maximumScale: 1` in `app/layout.tsx` verhindert bzw. erschwert Browser-Zoom und sollte aus Barrierefreiheitsgründen entfernt werden.

### 5.9 Fehlerbehandlung

`useLocalStorage.ts` fängt Fehler beim Parsen oder Schreiben nicht nutzerwirksam ab. Ein defekter JSON-Wert kann den Effekt abbrechen; Quota- oder Security-Fehler bleiben unsichtbar. Error Boundaries, strukturierte Logs, Tracing und Fehler-IDs fehlen.

### 5.10 Tests und Build

- Keine Unit-, Komponenten-, Integrations-, E2E-, Accessibility- oder Security-Tests vorhanden.
- Kein `test`-, `typecheck`- oder gültiger moderner Lint-Workflow im `package.json`.
- Lokaler `npm run build` scheiterte reproduzierbar mit `next: command not found`, weil `node_modules` fehlt.
- `npm ci` lieferte in der eingeschränkten Ausführungsumgebung innerhalb des Prüfzeitraums keine Ausgabe und keinen Abschluss. Daher wurde der Build **nicht verifiziert**; dies ist kein Beweis für einen Quellcodefehler.
- Keine CI-Konfiguration und kein Container-/Deployment-Manifest vorhanden.

### 5.11 Übernehmbarkeit für 2.0

| Bestandteil | Entscheidung |
|---|---|
| Next.js + React + TypeScript | Übernehmen und auf unterstützte, gepinnte Version aktualisieren |
| Tailwind/UI-Primitives | Übernehmen, zu Design Tokens und Accessibility-Standards ausbauen |
| App-Shell als visuelle Referenz | Konzept übernehmen, Field/Office Shells trennen |
| Job-Wizard | UX-Muster übernehmen, fachlich und technisch neu schneiden |
| Unterschriften-Canvas | Nur als Prototyp übernehmen; technische und rechtliche Nachweislogik neu |
| Mock-Kataloge | Als Seed-/Demo-Daten nutzbar |
| `localStorage`-Persistenz | Nicht übernehmen; höchstens für verschlüsselte, begrenzte Offline-Entwürfe |
| Bestehende Typen | Nicht als Zieldomänenmodell übernehmen |
| Browserdruck | Nicht als Dokumentengenerator übernehmen |
| Statische Rechtstexte | Nicht produktiv übernehmen; nur Platzhalter |

---

## 6. Sicherheits- und Datenschutzbewertung

### 6.1 Priorisierte Risiken

| Priorität | Risiko | Bestand | Maßnahme vor Produktion |
|---|---|---|---|
| P0 | Unberechtigter Zugriff | Keine Anmeldung oder Rechte | Serverseitige AuthN/AuthZ, Deny-by-default, RBAC |
| P0 | Fehlende Mandantentrennung | Keine Mandanten | `tenant_id` überall, DB-RLS/Policies, negative Isolationstests |
| P0 | Verlust personenbezogener Daten | Nur Browserdaten, kein Backup | PostgreSQL-Backups, PITR, Restore-Tests, definierte RPO/RTO |
| P0 | Manipulierbare Geschäftsbelege | Client kann alles ändern | Serverseitige Validierung, Transaktionen, Audit-Log, unveränderliche Dokument-Snapshots |
| P0 | Unsichere Fotos/Unterschriften | Unverschlüsselt als Data-URL im Browser | Privater Objektspeicher, Scan/Re-Encoding, Zugriffskontrolle, Aufbewahrung |
| P1 | Datenschutzinformation unzureichend | Generischer Platzhalter | Verzeichnis der Verarbeitung, Rechtsgrundlagen, AVV, Lösch- und Betroffenenprozess |
| P1 | Fehlende Nachweisführung | Keine Version/Hash/Zeit/Identität | Versionierte Vorlagen, Ereignisprotokoll, PDF-Hash, Signaturkontext |
| P1 | XSS-/Injection-Folgerisiko | Noch keine API; spätere Gefahr | Schema-Validierung, parametrisierte ORM-Abfragen, CSP, Output Encoding |
| P1 | CSRF/Session-Angriffe | Noch keine Sessions | SameSite/HttpOnly/Secure Cookies, Origin-Prüfung, CSRF-Schutz je Auth-Stack |
| P1 | Geheimnisverwaltung fehlt | Keine Backend-Secrets | Managed Secrets, Rotation, getrennte Umgebungen, keine Secrets im Client |
| P1 | Keine Auditierbarkeit | Keine Logs | Append-only Audit Events, Admin-Ansicht, Export, Alarmierung |
| P2 | Missbrauch/DoS | Keine Limits | Rate Limits, Uploadlimits, Quotas, WAF/CDN-Regeln |
| P2 | Lieferkettenrisiko | Lockfile vorhanden, keine Scans | Dependabot/Renovate, SCA, SBOM, signierte Builds, Patch-SLA |

### 6.2 Sicherheitsgrundsätze für 2.0

1. Jede Anfrage wird serverseitig authentifiziert und autorisiert.
2. `tenant_id` wird aus der aktiven, serverseitig geprüften Mitgliedschaft abgeleitet, niemals aus einem frei vertrauenswürdigen Request-Feld.
3. Jede mandantenbezogene Tabelle trägt `tenant_id`; zusammengesetzte Unique-/Foreign-Key-Regeln verhindern Querverknüpfungen.
4. PostgreSQL Row Level Security dient als zweite Barriere, nicht als Ersatz für Application Authorization.
5. Objektpfade beginnen mit einer nicht erratbaren Tenant-ID; Zugriff nur über kurzlebige signierte URLs nach Rechteprüfung.
6. Administrative, finanzielle und datenschutzrelevante Aktionen erzeugen unveränderliche Audit Events.
7. Logs enthalten keine Dokumentinhalte, Passwörter, Tokens oder unnötige personenbezogene Daten.
8. Produktionsdaten werden nie in Entwicklungs-/Preview-Umgebungen kopiert.
9. MFA ist mindestens für Admins und Inhaber verpflichtend; sichere Wiederherstellung und Session-Widerruf sind vorgesehen.
10. Backup ist erst dann belastbar, wenn Restore regelmäßig automatisiert getestet wurde.

### 6.3 DSGVO-Arbeitspakete

- Verantwortlicher, Zwecke, Datenkategorien, Rechtsgrundlagen und Empfänger dokumentieren
- Auftragsverarbeitungsverträge mit Hosting-, Auth-, Storage-, Mail- und Monitoring-Anbietern
- EU-Datenregionen bewusst konfigurieren; internationale Übermittlungen und Unterauftragsverarbeiter bewerten
- Lösch-/Sperrkonzept je Objektart und gesetzlicher Aufbewahrung
- Datenexport je Kunde und je Mandant
- Berichtigung, Einschränkung, Widerspruch und Auskunft als nachverfolgbare Workflows
- TOMs, Berechtigungskonzept, Incident- und Breach-Prozess
- Datenschutz-Folgenabschätzung prüfen, insbesondere bei Standort-/Mitarbeitertracking
- Consent nur dort verwenden, wo Einwilligung tatsächlich die passende Rechtsgrundlage ist
- Produktivtexte und Beleganforderungen durch Datenschutz- und Rechtsberatung prüfen lassen

---

## 7. Zielarchitektur

### 7.1 Empfohlener Stack

- **Frontend/BFF:** Next.js App Router + TypeScript, React Server Components wo sinnvoll
- **API:** typisierte Route Handlers/Server Actions hinter einer klaren Service-Schicht; öffentliche Integrationen als versionierte REST-API
- **Validierung:** Zod oder gleichwertig an jeder Systemgrenze
- **Datenbank:** PostgreSQL
- **ORM:** Prisma oder Drizzle; Entscheidung per Spike nach RLS-/Migrationstest. Empfehlung: Drizzle für SQL-Nähe/RLS-Transparenz oder Prisma bei höherer Teamvertrautheit.
- **Auth:** etablierter Anbieter/Library mit serverseitigen Sessions, MFA und Organisationseinladungen; keine Eigenentwicklung von Passwort- oder Tokenkryptografie
- **Dateien:** privater S3-kompatibler Objektspeicher in EU-Region
- **PDF:** serverseitiger Renderer aus versioniertem HTML/CSS-Template; Artefakt plus SHA-256 und Metadaten speichern
- **Jobs:** Postgres-basierter Job-Runner/Queue für PDFs, E-Mail, Virenscan und Exporte; zunächst kein separates Message-Broker-Cluster
- **E-Mail:** transaktionaler Anbieter mit EU-/DSGVO-Bewertung und Versandereignissen
- **Monitoring:** strukturierte Logs, Error Tracking, Metriken, Traces und Uptime Checks
- **CI/CD:** Typecheck, Lint, Unit, Integration, E2E, Migration-Check, SCA und Preview-Deployment

### 7.2 Logische Schichten

```text
Field UI / Office UI / später Kundenportal
                    │
        Next.js Server / BFF / API
                    │
      AuthZ + Domänenservices + Policies
         │             │             │
    PostgreSQL     Object Storage   Job Runner
         │             │             │
   Audit/Outbox     private files   PDF/Mail/Scan
```

Domänenmodule im modularen Monolithen:

- Identity & Tenancy
- CRM (Kunden, Kontakte, Standorte)
- Catalog & Pricing
- Sales (Anfragen, Angebote)
- Work Management (Aufträge, Termine, Einsätze, Zeiten)
- Documents
- Billing (Rechnungen, Zahlungen, Mahnungen)
- Tasks & Notifications
- Settings & Branding
- Audit & Privacy

Module kommunizieren über explizite Services und interne Domain Events/Outbox, nicht durch willkürliche Tabellenzugriffe aus UI-Komponenten.

### 7.3 Mandantenmodell

**Empfehlung für Start und Wachstum:** gemeinsame PostgreSQL-Datenbank, gemeinsames Schema, `tenant_id` in jeder mandantenbezogenen Zeile, RLS als zweite Schutzschicht.

| Modell | Vorteil | Nachteil | Urteil |
|---|---|---|---|
| Shared DB/shared schema | Geringster Betrieb, einfache Migrationen, kosteneffizient | Erfordert konsequente Isolation | **Empfohlen** |
| Shared DB/schema je Tenant | Stärkere logische Trennung | Migrationen und Verbindungen skalieren schlecht | Nicht für Start |
| DB je Tenant | Maximale Isolation/individuelle Restores | Hoher Betrieb und Kosten | Enterprise-Option später |

Verbindliche Kontrollen:

- `tenants`, `memberships`, `users`; ein Nutzer kann mehreren Betrieben angehören
- aktive Organisation in serverseitiger Session; Wechsel explizit und auditiert
- Tenant-scoped Repository-Funktionen ohne ungebundene `findById`
- zusammengesetzte Schlüssel wie `(tenant_id, id)` und tenant-konsistente FKs
- RLS-Policies für `SELECT/INSERT/UPDATE/DELETE`
- Tenant-Präfix und Metadaten im Objektspeicher
- Cache Keys und Queue Payloads immer tenant-scoped
- Integrationstests versuchen systematisch Cross-Tenant-Zugriffe
- Supportzugriff nur zeitlich begrenzt, begründet, genehmigt und auditiert

### 7.4 Kerndatenmodell

Mindestens folgende Aggregate/Tabellen:

```text
tenants, tenant_settings, branding_profiles, number_sequences
users, memberships, roles, permissions, sessions
customers, contacts, addresses, customer_addresses
inquiries, tasks, task_assignees
catalog_items, price_lists, price_list_items, assemblies, assembly_items
quotes, quote_versions, quote_lines, quote_events
jobs, job_assignments, appointments, job_status_events
work_logs, time_entries, material_usages, checklist_runs, checklist_results
documents, document_versions, document_templates, files
acceptances, signatures
invoices, invoice_lines, invoice_events, payments, dunning_events
audit_events, outbox_events, feature_flags
```

Querschnittsfelder: `id` (UUIDv7/ULID), `tenant_id`, `created_at`, `created_by`, `updated_at`, `updated_by`, optional `deleted_at`, `version`. Finanzbelege werden nicht hart gelöscht, sondern durch fachliche Gegenbelege storniert.

### 7.5 Dokument- und Nummernkonzept

- Nummernkreise pro Tenant, Dokumenttyp und Geschäftsjahr; Vergabe transaktional
- Entwurf darf interne UUID nutzen; endgültige Nummer erst bei verbindlicher Ausgabe
- Angebotsversionen und Rechnungen speichern Positionstexte, Mengen, Preise, Steuern und Empfängeradresse als Snapshot
- Vorlagen mit Version und Status `draft/published/retired`
- Erzeugtes PDF: Objektpfad, SHA-256, MIME, Größe, Template-Version, Ersteller und Zeit
- Nach verbindlicher Ausgabe keine stille Überschreibung; neue Version oder Storno/Korrektur

### 7.6 Offline-/Schlechtverbindungsstrategie

Für Phase 1 genügt online-first mit robuster Entwurfswiederherstellung. Danach:

- Service Worker/PWA für App-Shell und Tagesaufträge
- IndexedDB statt `localStorage`
- lokal verschlüsselte, minimal notwendige Datensätze
- Mutation Queue mit idempotency key
- sichtbarer Syncstatus und Konfliktlösung
- keine dauerhafte Vollkopie aller Kundendaten
- Remote Wipe/Session-Widerruf konzeptionell berücksichtigen

---

## 8. Hostingvergleich und Empfehlung

Die Preise und Leistungsgrenzen ändern sich; vor Beauftragung ist ein aktuelles Angebot einschließlich AVV/DPA und Unterauftragsverarbeitern einzuholen.

| Modell | Kosten | Betrieb | Datenschutz/Region | Eignung |
|---|---|---|---|---|
| Vercel + gemanagte EU-Postgres/Storage | Niedriger Einstieg, nutzungsabhängig | Sehr gering | Compute explizit auf Frankfurt setzen; Vercel weist auf mögliche internationale Verarbeitung hin | Schnellster MVP-/SaaS-Start |
| Supabase EU als DB/Auth/Storage + Next.js Hosting | Niedriger bis mittlerer Einstieg | Gering | Konkrete EU-Region wählen, nicht nur allgemeines „Europe“; Backups planabhängig | Gute schlanke Plattform, Vendor-Kopplung prüfen |
| EU-PaaS/Container + Managed PostgreSQL/S3 | Mittel | Mittel | Gute regionale Kontrolle je Anbieter | Gute Balance bei höheren Compliance-Anforderungen |
| Eigener Hetzner-/Cloud-Server | Infrastruktur günstig | Hoch: Patching, HA, Backup, Monitoring selbst | Deutscher/EU-Standort gut steuerbar | Nur mit belastbarer DevOps-Verantwortung |
| AWS/Azure/GCP EU Managed Services | Mittel bis hoch/komplex | Mittel | Sehr granular, umfangreiche Verträge/Controls | Für Wachstum/Enterprise, für Start oft zu komplex |

**Empfehlung:** Für den kontrollierten Start Vercel (Next.js, Compute `fra1`) plus dedizierte gemanagte PostgreSQL- und S3-kompatible Storage-Dienste in einer konkreten EU-Region oder ein konsolidierter Supabase-EU-Stack. Für strengere Datenresidenz kann ein EU-PaaS mit Managed PostgreSQL und EU-Objektspeicher vorzuziehen sein. Die endgültige Wahl erfolgt erst nach DPA-/Subprocessor-Prüfung, Kostenmodell für reale Last, Backup-/Restore-Nachweis und Exit-Test.

Wichtige aktuelle Anbieterhinweise:

- Vercel Functions laufen standardmäßig in Washington, D.C.; die Region muss bewusst z. B. auf Frankfurt gesetzt werden: <https://vercel.com/docs/functions/configuring-functions/region>
- Vercel beschreibt mögliche Verarbeitung/Übermittlung außerhalb der EU im Shared-Responsibility-Modell: <https://vercel.com/docs/security/compliance>
- Supabase empfiehlt bei Datenresidenz eine konkrete Region; die allgemeine Region „Europe“ kann auch Nicht-EU-Standorte umfassen: <https://supabase.com/docs/guides/platform/regions>
- Supabase beschreibt tägliche Backups und optionale Point-in-Time-Recovery abhängig vom Plan: <https://supabase.com/docs/guides/platform/backups>

### Mindest-Betriebskonzept

- Dev, Staging und Production strikt getrennt
- Infrastructure as Code und versionierte DB-Migrationen
- tägliche Backups plus PITR nach RPO-Anforderung
- monatlicher automatisierter Restore-Test in isolierter Umgebung
- Zielwerte zum Start: RPO ≤ 1 Stunde, RTO ≤ 4 Stunden; fachlich bestätigen
- Uptime-, Fehlerquoten-, Latenz-, Queue- und Backup-Alarme
- Rollback der Anwendung; für Datenmigrationen bevorzugt expand/migrate/contract statt Down-Migration
- Feature Flags für riskante Funktionen und tenantweises Rollout
- dokumentierter Incident-, Datenschutzvorfall- und Disaster-Recovery-Prozess

---

## 9. Umsetzungsroadmap

### Phase 0 – Entscheidungen und Grundlagen

- Fachliche Workshops und Rechts-/Datenschutzprüfung
- Statusautomaten, Rollenmatrix, Nummern- und Steuerregeln festlegen
- ADRs für Hosting, ORM, Auth, Storage und PDF
- CI, Umgebungen, Observability und Security Baseline

**Exit:** Architekturentscheidungen dokumentiert; Threat Model und priorisiertes Backlog abgenommen.

### Phase 1 – SaaS-Fundament

- Tenants, Benutzer, Einladungen, Rollen, serverseitige Sessions
- PostgreSQL, Migrationen, RLS, Audit-Events
- Betriebsprofil, Branding-Grundlagen
- sichere Datei-Upload-Pipeline
- Backup/Restore und Monitoring

**Exit:** Automatisierte Cross-Tenant-Tests; Restore-Test erfolgreich; keine P0-Sicherheitslücke.

### Phase 2 – CRM, Kataloge und Aufträge

- Kunden, Kontakte, Adressen
- Artikel/Leistungen, Preislisten, Stücklisten
- Auftrag, Termin, Zuweisung und Statushistorie
- Office-Listen/Filter und Field-Tagesansicht
- Migration der sinnvollen Wizard-Funktionen

**Exit:** Büro kann einen Auftrag planen; Monteur kann ihn vollständig dokumentieren.

### Phase 3 – Angebote und Dokumente

- Angebotsversionen und Kalkulation
- Angebotsfreigabe/-umwandlung
- versionierte Vorlagen und Branding
- serverseitige PDF-Erstellung, Archiv und E-Mail

**Exit:** Angebot bleibt nach Katalogänderungen unverändert reproduzierbar.

### Phase 4 – Arbeitsnachweis und Rechnungen

- Zeit-/Materialerfassung, Checklisten, Abnahme und Signaturen
- Rechnungen, Abschläge, Schlussrechnung, Storno/Gutschrift
- Versand- und Zahlungsstatus, Exporte

**Exit:** Durchgängiger Happy Path Anfrage bis Rechnung mit E2E-Test.

### Phase 5 – Offline, Automatisierung und Skalierung

- Offline-Entwürfe/Sync
- Aufgaben, Wiedervorlagen, Benachrichtigungen
- Reporting, Kundenportal und Integrationen nach Priorität
- Performance-, Last- und Penetrationstests

---

## 10. Qualitäts- und Abnahmekriterien

- Kein API-Endpunkt vertraut einer vom Client gelieferten Tenant-Zuordnung.
- Jeder privilegierte Use Case besitzt mindestens einen negativen Autorisierungstest.
- Cross-Tenant-Lese-, Änderungs- und Löschversuche schlagen in App und DB fehl.
- Geldberechnungen sind zentral, deterministisch und mit Steuer-/Rundungsfällen getestet.
- Dokumente sind versioniert, reproduzierbar und nach Ausgabe nicht still veränderbar.
- WCAG 2.2 AA für Kernabläufe; Touch-Ziele und Tastaturbedienung sind getestet.
- Unterstützte Browser/iPadOS-Versionen sind definiert und per E2E abgedeckt.
- Core Web Vitals und API-Latenzbudgets sind festgelegt.
- Uploadlimits, Typprüfung, Malware-/Bildpipeline und Zugriffsschutz sind getestet.
- `typecheck`, `lint`, Unit-, Integrations- und E2E-Tests laufen in CI.
- Migrationen werden gegen produktionsnahe Datenmengen getestet.
- Backup-Restore wird regelmäßig nachgewiesen.
- Security Headers/CSP, sichere Cookies, Rate Limits und Secret Scans sind aktiv.
- Datenschutzexport und Lösch-/Sperrworkflow sind fachlich und technisch abgenommen.

---

## 11. Ausführbarer Implementierungsprompt für Version 2.0

Der folgende Prompt ist für eine nachgelagerte, kontrollierte Implementierungsphase vorgesehen. Er soll in einem neuen Arbeitsauftrag zusammen mit diesem Audit verwendet werden.

```text
DU BIST
Senior Softwarearchitekt und Full-Stack-Entwickler für eine mandantenfähige,
DSGVO-orientierte Handwerker-SaaS. Arbeite inkrementell, prüfbar und sicher.

KONTEXT
Repository: Handwerker-App.
Lies zuerst vollständig:
1. docs/HANDWERKER_APP_2_AUDIT_UND_IMPLEMENTIERUNGSPROMPT.md
2. README.md, package.json und alle Dateien unter src/
3. vorhandene AGENTS.md/Projektregeln, sofern vorhanden

Die aktuelle App ist ein clientseitiger Prototyp. LocalStorage, Mockdaten und
Browserdruck sind keine Zielarchitektur. Erhalte sinnvolle UX-Ideen, aber baue
Backend, Domäne und Sicherheit systematisch neu auf.

NICHT VERHANDELBARE ZIELE
- Gemeinsame Next.js-/TypeScript-Codebasis als modularer Monolith
- PostgreSQL mit versionierten Migrationen
- Sichere serverseitige Authentifizierung und Autorisierung
- Mandantentrennung in App, DB, Cache, Queue und Storage
- Privater EU-Objektspeicher für Dateien
- Field UI für iPad und Office UI für Desktop aus einem Designsystem
- Durchgängiger Prozess Anfrage → Angebot → Auftrag → Einsatz/Abnahme → Rechnung
- Versionierte, reproduzierbare PDFs und Dokumentvorlagen
- Audit, Backups, Monitoring, Tests und CI/CD
- Keine Microservices ohne nachgewiesenen Bedarf

ARBEITSWEISE
1. Beginne nicht mit flächiger Implementierung. Prüfe den Repository-Stand und
   erstelle/aktualisiere einen konkreten Plan mit kleinen, abnehmbaren Phasen.
2. Dokumentiere vor jeder grundlegenden Technologieentscheidung ein ADR mit
   Alternativen, Entscheidung und Folgen.
3. Implementiere vertikale Slices. Jeder Slice enthält Datenmodell, Migration,
   serverseitige Policy/Service, UI, Tests, Audit und Dokumentation.
4. Führe nach jedem Slice Typecheck, Lint, Unit-/Integrationstests und relevante
   E2E-Tests aus. Behebe Fehler, bevor du fortfährst.
5. Verändere keine fremden/unzusammenhängenden Änderungen. Keine produktiven
   Daten löschen, keine Secrets einchecken, keine destruktiven Migrationen ohne
   explizite Freigabe und Migrationsplan.
6. Wenn eine fachliche Entscheidung (Steuer, Nummernkreis, Rollen, Signatur,
   Aufbewahrung) nicht aus den Anforderungen ableitbar ist, dokumentiere die
   offene Entscheidung und implementiere keine erfundene Rechtsregel.

ARCHITEKTURREGELN
- UI-Komponenten greifen nie direkt auf das ORM zu.
- Request → Schema-Validierung → AuthN → Tenant-Kontext → AuthZ → Service → Repo.
- Tenant-Kontext stammt aus geprüfter Session/Mitgliedschaft, nicht aus einem
  frei vertrauenswürdigen Request-Parameter.
- Jede mandantenbezogene Tabelle besitzt tenant_id; tenant-konsistente Foreign
  Keys, Indizes und RLS-Policies sind Pflicht.
- Keine ungebundenen findById/updateById/deleteById-Repositorymethoden.
- Mutationen mit externen Effekten nutzen Transaktion + Outbox/Job.
- Geld in Integer-Minor-Units oder exakt definiertem DB-Decimal; niemals
  unkontrollierte JavaScript-Fließkomma-Arithmetik.
- Historische Belege speichern Snapshots. Katalogänderungen verändern keine
  bestehenden Angebote/Rechnungen.
- Finanzbelege werden nicht hart gelöscht; Korrektur über fachliche Ereignisse.
- Dateien bleiben privat. Download nur nach Autorisierung über kurzlebige URL.
- Logs sind strukturiert und enthalten keine sensiblen Inhalte oder Tokens.

VORGESCHLAGENE REPOSITORY-STRUKTUR
src/
  app/
    (auth)/
    (office)/
    (field)/
    api/
  modules/
    identity/
    tenancy/
    crm/
    catalog/
    sales/
    work/
    documents/
    billing/
    tasks/
    audit/
  components/
  lib/
db/
  schema/
  migrations/
tests/
  unit/
  integration/
  e2e/
docs/
  adr/
  threat-model/
  operations/

PHASE 0 – BASELINE UND ENTSCHEIDUNGEN
- Bestands-Build reproduzierbar machen; unterstützte Node-/Package-Versionen pinnen.
- Scripts für format, lint, typecheck, test, test:integration, test:e2e, build.
- CI mit Lockfile-Install, Caches, SCA/Secret Scan und Build.
- ADRs für Hosting, DB/ORM, Auth, Storage, PDF und Job-Runner.
- Rollenmatrix, Statusautomaten und Threat Model als überprüfbare Dokumente.
- Kein Produktivfeature vor erfolgreicher Baseline.

PHASE 1 – TENANCY UND IDENTITY
- Tabellen tenants, users, memberships, roles/permissions und audit_events.
- Sichere Session-Cookies, MFA-Fähigkeit, Einladung und Tenant-Wechsel.
- Serverseitige Guards/Policies und DB-RLS.
- Seed nur für lokale Demo; keine produktiven Standardpasswörter.
- Integrationstests für zwei Tenants und mehrere Rollen; Cross-Tenant-Angriffe.
- Minimales Admin-UI für Betrieb und Mitglieder.

PHASE 2 – CRM UND KATALOG
- customers, contacts, addresses mit Tenant-Isolation und Soft-Delete-Regeln.
- catalog_items, price_lists, assemblies und versionierbare Preise.
- Office-Tabellen mit Suche, Filter, Pagination und Tastaturbedienung.
- iPad-optimierte Kunden-/Katalogauswahl.
- Validierung, Audit Events, Import/Export nur mit Berechtigung.

PHASE 3 – AUFTRAG UND DISPOSITION
- jobs, assignments, appointments, status_events.
- Expliziter Statusautomat; Transitionen serverseitig erzwingen.
- Office-Disposition und Field-Tagesliste.
- Entwurfs-Autosave, idempotente Mutationen und Optimistic-Concurrency-Version.
- Bestehenden Wizard in kleine, domänenspezifische Schritte zerlegen.

PHASE 4 – ANGEBOT UND DOKUMENTE
- quote + quote_versions + lines; Kalkulation inkl. Steuer/Rundung testen.
- Versioniertes Template/Branding und serverseitiges PDF.
- PDF-Artefakt mit Hash, Template-Version und Audit Event speichern.
- Versand über Job/Outbox; Provider-ID und Versandstatus speichern.
- Angenommenes Angebot transaktional in Auftrag umwandeln.

PHASE 5 – EINSATZ, ABNAHME UND DATEIEN
- time_entries, material_usages, checklist_runs, acceptances, signatures.
- Direkter, validierter Upload; Größen-/Typgrenzen, Re-Encoding/Scan, EXIF-Regel.
- Signatur mit Unterzeichner, Zweck, Zeitpunkt, Dokumentversion und Hash.
- Arbeitsnachweis als unveränderliches Dokument erzeugen.
- iPad UX mit großen Touch-Zielen, sichtbarem Sync-/Speicherstatus.

PHASE 6 – RECHNUNG
- invoices, invoice_lines, events, payments; Nummern transaktional vergeben.
- Abschlag/Schlussrechnung sowie Storno/Gutschrift nur nach bestätigten Regeln.
- Unveränderliche Snapshots und PDF-Archiv.
- Zahl-/Versandstatus und autorisierter Export.
- E2E-Happy-Path von Kunde bis Rechnung sowie negative Berechtigungstests.

PHASE 7 – BETRIEB UND OFFLINE
- Backup/PITR konfigurieren, Restore automatisiert testen und protokollieren.
- SLOs, Dashboards, Alerts, Runbooks und Incident-Prozess.
- Feature Flags und tenantweiser Rollout.
- Erst danach begrenzte IndexedDB-/PWA-Offlinefähigkeit mit Queue,
  Idempotency Keys, Konfliktanzeige und Datenminimierung.

SICHERHEITS-ABNAHME PRO PHASE
- Positive und negative AuthZ-Tests
- Cross-Tenant-Test auf jede neue Ressource
- RLS-Policy-Test
- Eingabe-, Upload- und Rate-Limit-Test, soweit relevant
- Audit Event für privilegierte/finanzielle Aktion
- Keine hochkritischen SCA-/SAST-Befunde
- Security Headers und CSP ohne unnötiges unsafe-inline/unsafe-eval

DEFINITION OF DONE PRO SLICE
- Fachliche Akzeptanzkriterien erfüllt
- Migration vorwärts getestet; Rollout-/Kompatibilitätsplan vorhanden
- Unit-, Integration- und E2E-Tests grün
- Accessibility des Kernwegs geprüft
- Observability vorhanden, Fehlerzustände nutzerverständlich
- Dokumentation/ADR/Runbook aktualisiert
- Keine neue P0/P1-Sicherheitslücke
- Build reproduzierbar und CI grün

ERSTE KONKRETE AUSGABE
Liefere zunächst ausschließlich:
1. verifizierte Bestandszusammenfassung,
2. offene fachliche Entscheidungen,
3. vorgeschlagene ADR-Liste,
4. detaillierten Plan für Phase 0 und Phase 1,
5. Dateiliste der beabsichtigten Änderungen,
6. konkrete Test- und Abnahmematrix.

Beginne mit Implementierung erst nach Freigabe dieses Plans. Führe keine
umfangreiche automatische Neuformatierung und keine Datenlöschung aus.
```

---

## 12. Offene Entscheidungen vor Implementierung

1. Welche Gewerke und welche steuerlichen Sonderfälle müssen in Version 2.0 zuerst unterstützt werden?
2. Welche Rollen dürfen Preise, Rabatte, Angebote, Rechnungen und Benutzer verwalten?
3. Welche Belegarten, Nummernkreise und Korrekturprozesse sind erforderlich?
4. Sind ZUGFeRD/XRechnung und DATEV im ersten Release Pflicht?
5. Welche RPO/RTO- und Verfügbarkeitsziele werden vertraglich zugesagt?
6. Muss Datenhaltung ausschließlich in Deutschland oder nur in der EU erfolgen?
7. Ist Offlinebetrieb am ersten Release-Tag Pflicht oder reicht online-first mit Entwurfsrettung?
8. Welche bestehenden Daten müssen migriert werden? Der aktuelle MVP besitzt nur gerätelokale Daten.
9. Welche rechtlichen Texte, Aufbewahrungsfristen und Signaturnachweise sind anwaltlich bestätigt?
10. Wird ein Kundenportal benötigt, und falls ja, in welcher Produktphase?

## Schlussfolgerung

Der Bestand ist als **UX-Prototyp und Anforderungsquelle** wertvoll. Eine schrittweise Umwandlung der `localStorage`-App durch bloßes Ergänzen einzelner API-Endpunkte wäre jedoch riskant, weil das bestehende Datenmodell die wesentlichen SaaS-, Mandanten-, Beleg- und Sicherheitsanforderungen nicht trägt. Empfohlen ist ein kontrollierter Neuaufbau innerhalb desselben Repositories: zuerst Plattformfundament und Isolation, dann vertikale Domänenslices. So bleiben die guten mobilen Interaktionsideen erhalten, ohne die Prototypgrenzen zur Produktionsarchitektur zu machen.
