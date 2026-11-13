import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { LoginForm } from "@/app/login/LoginForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readSupabasePublicConfig } from "@/lib/supabase/config";

export default function LoginPage() {
  const authenticationEnabled = Boolean(readSupabasePublicConfig());

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-7">
        <Badge className="w-fit border-primary/20 bg-primary/10 text-primary">Handwerker Service App 2.0</Badge>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Der Betrieb im Blick. Das Team sicher verbunden.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Mandantenfähige Einsatzsteuerung mit klaren Rollen, geschützten Betriebsdaten und nachvollziehbaren
            Änderungen.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3 rounded-lg border bg-white/70 p-4">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">Getrennte Betriebsdaten</p>
              <p className="mt-1 text-sm text-muted-foreground">Datenzugriffe sind technisch je Mandant abgesichert.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border bg-white/70 p-4">
            <LockKeyhole className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">Starke Anmeldung</p>
              <p className="mt-1 text-sm text-muted-foreground">Admin-Zugriffe verlangen einen zweiten Faktor.</p>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-white/80 bg-white/90 shadow-xl backdrop-blur-xl">
        <CardHeader className="p-7 pb-5">
          <CardTitle className="text-2xl">Willkommen zurück</CardTitle>
          <CardDescription>Mit dem persönlichen Betriebszugang anmelden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-7 pb-7">
          <LoginForm enabled={authenticationEnabled} />
          {!authenticationEnabled ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
              <p className="font-semibold">Lokale Entwicklungsvorschau</p>
              <p className="mt-1 text-sm">
                Supabase ist noch nicht verbunden. Die Teamverwaltung kann mit gekennzeichneten Beispieldaten angesehen
                werden.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full border-amber-400 bg-white">
                <Link href="/admin">
                  Vorschau öffnen <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}
          <p className="text-center text-xs text-muted-foreground">
            Kein öffentlicher Zugang. Neue Konten werden ausschließlich eingeladen.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
