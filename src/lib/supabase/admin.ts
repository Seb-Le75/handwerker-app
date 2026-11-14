import "server-only";

import { createClient } from "@supabase/supabase-js";

import { readSupabasePublicConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  const publicConfig = readSupabasePublicConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!publicConfig || !secretKey) throw new Error("Supabase invitation delivery is not configured.");

  return createClient(publicConfig.url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

export function readApplicationUrl() {
  const value = process.env.APP_URL?.trim();
  if (!value) throw new Error("APP_URL is required for authentication links.");
  const url = new URL(value);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) {
    throw new Error("APP_URL must use HTTPS outside localhost.");
  }
  return url.origin;
}
