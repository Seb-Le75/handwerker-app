"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { safeInternalPath } from "@/lib/navigation/safe-redirect";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { readSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = Readonly<{ message: string }>;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200)
});

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  if (!readSupabasePublicConfig()) return { message: "Die Anmeldung ist in der lokalen Vorschau deaktiviert." };

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { message: "Bitte E-Mail-Adresse und Passwort vollständig eingeben." };

  const allowed = await consumeRateLimit({
    scope: "login_email",
    identifier: parsed.data.email,
    limit: 8,
    windowSeconds: 900
  });
  if (!allowed) return { message: "Anmeldung vorübergehend gesperrt. Bitte später erneut versuchen." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: "Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen." };

  redirect(safeInternalPath(String(formData.get("next") ?? "")));
}
