"use client";

import { createBrowserClient } from "@supabase/ssr";

import { readSupabasePublicConfig } from "@/lib/supabase/config";

export function createClient() {
  const config = readSupabasePublicConfig();
  if (!config) throw new Error("Supabase Auth is not configured.");
  return createBrowserClient(config.url, config.publishableKey);
}
