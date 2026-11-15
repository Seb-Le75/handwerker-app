"use server";

import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { readApplicationUrl } from "@/lib/supabase/admin";
import { readSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = Readonly<{ status: "idle" | "success" | "error"; message: string }>;
const schema = z.string().trim().toLowerCase().email();
const genericMessage = "Falls ein Konto existiert, wurde eine E-Mail zum Zurücksetzen versendet.";

export async function requestPasswordReset(
  _state: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  if (!readSupabasePublicConfig()) {
    return { status: "error", message: "Die Passwort-Wiederherstellung ist in der Vorschau deaktiviert." };
  }
  const parsed = schema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: "Bitte eine gültige E-Mail-Adresse eingeben." };

  const allowed = await consumeRateLimit({
    scope: "password_reset_email",
    identifier: parsed.data,
    limit: 3,
    windowSeconds: 3600
  });
  if (!allowed) return { status: "success", message: genericMessage };

  try {
    const redirectTo = new URL("/reset-password", readApplicationUrl());
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: redirectTo.toString() });
  } catch {
    // The response deliberately does not disclose account existence or provider state.
  }
  return { status: "success", message: genericMessage };
}
