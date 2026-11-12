# ADR-0004: Authentifizierung

- Status: accepted
- Datum: 2026-11-12

## Anforderungen

Serverseitige Sessions, sichere Cookies, Session-Widerruf, MFA für Admins, Passkey-Fähigkeit, Einladungen, Rate Limits, generische Recovery-Antworten und EU-/DPA-Prüfbarkeit.

## Entscheidung

Supabase Auth wird in einer konkreten Frankfurter Projektregion eingesetzt. Phase 1 startet mit ausschließlich eingeladenen E-Mail-/Passwortkonten und TOTP-MFA; öffentliche Registrierung bleibt deaktiviert. Admins müssen AAL2 erreichen. Passkeys bleiben eine spätere Option und sind kein Release-Blocker, solange Passwort plus MFA verfügbar ist.

Servercode vertraut niemals ungeprüft `getSession()`, sondern validiert Identität über `getClaims()` beziehungsweise bei Bedarf `getUser()`. Die Anwendung bleibt Eigentümerin von Tenant-Mitgliedschaften und fachlichen Rollen; Auth-JWTs sind keine alleinige Autorisierungsquelle.

## Folgen

Vor Produktivbetrieb müssen DPA, Unterauftragsverarbeiter, SMTP, Rate Limits, Sessionlaufzeiten und Recovery-Prozess abgenommen werden. Supabase stellt keine MFA-Recovery-Codes bereit; deshalb sind Backup-Faktor und ein streng geprüfter Admin-Recovery-Prozess erforderlich.

Quellen: <https://supabase.com/docs/guides/auth>, <https://supabase.com/docs/guides/auth/server-side/creating-a-client>, <https://supabase.com/docs/guides/auth/auth-mfa/totp>
