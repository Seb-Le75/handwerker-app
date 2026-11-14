"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { acceptInvitation, InvitationAcceptanceError } from "@/features/admin/invitation-acceptance";
import { activeTenantCookie } from "@/features/admin/constants";
import { createClient } from "@/lib/supabase/server";

export type AcceptInvitationState = Readonly<{ message: string }>;

export async function acceptMemberInvitation(
  token: string,
  _state: AcceptInvitationState,
  _formData: FormData
): Promise<AcceptInvitationState> {
  void _state;
  void _formData;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const subject = claims?.sub;
  const email = claims?.email;
  const displayName = typeof claims?.user_metadata?.name === "string" ? claims.user_metadata.name : null;
  if (error || typeof subject !== "string" || typeof email !== "string") redirect(`/login?next=/invite/${token}`);

  let invitedAuthUser = false;
  try {
    const result = await acceptInvitation({
      token,
      authSubject: subject,
      email,
      displayName
    });
    (await cookies()).set(activeTenantCookie, result.tenantId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      priority: "high"
    });
    invitedAuthUser = claims?.user_metadata?.invitation_id === result.invitationId;
  } catch (acceptanceError) {
    if (acceptanceError instanceof InvitationAcceptanceError) {
      return { message: "Diese Einladung ist ungültig, abgelaufen oder gehört zu einem anderen Konto." };
    }
    return { message: "Die Einladung konnte nicht sicher angenommen werden." };
  }

  redirect(invitedAuthUser ? "/reset-password?invited=1" : "/admin");
}
