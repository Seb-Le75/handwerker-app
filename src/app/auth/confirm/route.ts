import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { safeInternalPath } from "@/lib/navigation/safe-redirect";
import { createClient } from "@/lib/supabase/server";

const supportedTypes = new Set<EmailOtpType>(["invite", "recovery", "email", "signup", "magiclink"]);

function destination(value: string | null, origin: string) {
  if (!value) return "/admin";
  try {
    const parsed = new URL(value, origin);
    if (parsed.origin !== origin) return "/admin";
    return safeInternalPath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch {
    return "/admin";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = destination(requestUrl.searchParams.get("next"), requestUrl.origin);

  if (tokenHash && type && supportedTypes.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("error", "link");
  return NextResponse.redirect(loginUrl);
}
