import { KeyRound, ShieldCheck } from "lucide-react";

import { MfaSetup } from "@/app/mfa/MfaSetup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MfaPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-10">
      <Card className="w-full border-white/80 bg-white/90 shadow-xl backdrop-blur-xl">
        <CardHeader className="items-center p-7 text-center">
          <div className="mb-3 rounded-full bg-primary/10 p-4 text-primary">
            <KeyRound className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Admin-Zugang absichern</CardTitle>
          <CardDescription>Für Verwaltungsfunktionen ist ein zweiter Faktor erforderlich.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-7 pb-7">
          <MfaSetup />
          <div className="flex items-start gap-2 rounded-md bg-secondary/60 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Der einmalige Code wird nur zur Prüfung an den Authentifizierungsdienst übertragen.</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
