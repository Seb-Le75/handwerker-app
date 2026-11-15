import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readSupabasePublicConfig } from "@/lib/supabase/config";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const enabled = Boolean(readSupabasePublicConfig());
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-10">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle>Passwort zurücksetzen</CardTitle>
          <CardDescription>Wir senden einen zeitlich begrenzten Link an die hinterlegte Adresse.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ForgotPasswordForm enabled={enabled} />
          {!enabled ? (
            <p className="text-sm text-amber-800">In der lokalen Vorschau ist kein E-Mail-Versand verbunden.</p>
          ) : null}
          <Link className="block text-center text-sm font-medium text-primary hover:underline" href="/login">
            Zurück zur Anmeldung
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
