import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ invited?: string }> }) {
  const invited = (await searchParams).invited === "1";
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-10">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle>{invited ? "Konto fertig einrichten" : "Neues Passwort festlegen"}</CardTitle>
          <CardDescription>
            {invited
              ? "Legen Sie jetzt Ihr persönliches Passwort fest. Danach ist Ihr Teamzugang vollständig eingerichtet."
              : "Verwenden Sie mindestens 12 Zeichen und am besten einen Passwortmanager."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
