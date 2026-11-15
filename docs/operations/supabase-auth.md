# Supabase Auth einrichten

Die Anwendung verwendet serverseitige Cookie-Sitzungen. Das Supabase-Projekt muss deshalb E-Mail-Token an
`/auth/confirm` senden; die Standardvorlage mit `ConfirmationURL` reicht für SSR nicht aus.

## Umgebungsvariablen

- `NEXT_PUBLIC_SUPABASE_URL`: Projekt-URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: öffentlicher Publishable Key
- `SUPABASE_SECRET_KEY`: geheimer Server-Key (`sb_secret_…`), niemals mit `NEXT_PUBLIC_` kennzeichnen
- `APP_URL`: öffentliche HTTPS-Basis-URL der Anwendung
- `RATE_LIMIT_SECRET`: mindestens 32 zufällige Zeichen, getrennt von allen Supabase-Schlüsseln

Die `APP_URL` muss in Supabase unter **Authentication → URL Configuration → Redirect URLs** erlaubt sein.

## E-Mail-Vorlagen

In **Authentication → Email Templates** werden mindestens die Vorlagen **Invite user** und **Reset password**
angepasst. Auch die Vorlage **Magic link** wird benötigt, wenn ein bereits vorhandenes Konto einem weiteren
Betrieb beitritt. Alle Links führen zuerst zum eigenen, serverseitigen Bestätigungs-Endpunkt.

Einladung:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next={{ .RedirectTo }}">
  Einladung annehmen
</a>
```

Passwort-Wiederherstellung:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}">
  Passwort zurücksetzen
</a>
```

Magic Link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next={{ .RedirectTo }}">
  Team-Einladung öffnen
</a>
```

`Site URL` muss derselben Origin wie `APP_URL` entsprechen. Für Produktion ist ein eigener SMTP-Anbieter nötig;
der eingebaute Supabase-Versand ist stark begrenzt. Link-Tracking beim SMTP-Anbieter bleibt deaktiviert, weil es
Einmal-Links verändern kann.

## Sicherheitskontrolle vor Produktivstart

1. Einladung an eine neue Testadresse senden und genau einmal annehmen.
2. Erneutes Öffnen desselben Links muss abgewiesen werden.
3. Einladung mit einem anderen angemeldeten Konto muss abgewiesen werden.
4. Passwort-Link öffnen, Passwort ändern und den Link erneut testen.
5. Auth-Rate-Limits und optional CAPTCHA im Supabase-Dashboard konfigurieren.
