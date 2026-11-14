import { ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { AcceptInvitationForm } from "./AcceptInvitationForm";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-10">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <ShieldCheck className="mb-3 h-9 w-9 text-accent" />
          <CardTitle>Team-Einladung</CardTitle>
          <CardDescription>
            Nach der Prüfung wird Ihr persönliches Konto genau diesem Betrieb und der vorgesehenen Rolle zugeordnet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInvitationForm token={token} />
          <p className="mt-4 text-xs text-muted-foreground">Der Einladungslink ist nur einmal verwendbar.</p>
        </CardContent>
      </Card>
    </main>
  );
}
