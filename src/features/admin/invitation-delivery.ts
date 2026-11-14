import "server-only";

import { createAdminClient, readApplicationUrl } from "@/lib/supabase/admin";

export async function deliverInvitation(input: {
  email: string;
  token: string;
  tenantId: string;
  invitationId: string;
}) {
  const origin = readApplicationUrl();
  const destination = `/invite/${encodeURIComponent(input.token)}`;
  const redirectTo = new URL(destination, origin);

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: redirectTo.toString(),
    data: { tenant_id: input.tenantId, invitation_id: input.invitationId }
  });
  if (!error) return;

  // Supabase cannot send a second "invite" to an already confirmed account. In that
  // case only, send a non-creating magic link to the same one-time app invitation.
  if (error.code === "email_exists" || error.code === "user_already_exists") {
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: input.email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo.toString() }
    });
    if (!magicLinkError) return;
    throw new Error(`Supabase magic-link delivery failed (${magicLinkError.code ?? magicLinkError.status}).`);
  }

  throw new Error(`Supabase invitation delivery failed (${error.code ?? error.status}).`);
}
