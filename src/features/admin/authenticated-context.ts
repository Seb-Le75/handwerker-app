import "server-only";

import { cookies } from "next/headers";

import type { Database } from "@/db/client";
import { createSqlClient } from "@/db/client";
import { resolveIdentity } from "@/db/identity-context";
import type { VerifiedTenantContext } from "@/db/tenant-context";
import { withTenantContext } from "@/db/tenant-context";
import { activeTenantCookie } from "@/features/admin/constants";
import { readSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export class AuthenticatedMutationError extends Error {
  constructor(readonly code: "preview" | "unauthenticated" | "unassigned" | "mfa_required" | "configuration") {
    super(code);
    this.name = "AuthenticatedMutationError";
  }
}

export async function withAuthenticatedTenant<T>(
  operation: (database: Database, context: VerifiedTenantContext) => Promise<T>
) {
  if (!readSupabasePublicConfig()) throw new AuthenticatedMutationError("preview");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;
  if (error || !subject) throw new AuthenticatedMutationError("unauthenticated");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new AuthenticatedMutationError("configuration");

  const client = createSqlClient(databaseUrl);
  try {
    const identity = await resolveIdentity(client, subject);
    if (!identity || identity.memberships.length === 0) throw new AuthenticatedMutationError("unassigned");

    const requestedTenantId = (await cookies()).get(activeTenantCookie)?.value;
    const membership =
      identity.memberships.find((candidate) => candidate.tenantId === requestedTenantId) ?? identity.memberships[0];
    const assuranceLevel = typeof data.claims.aal === "string" ? data.claims.aal : "aal1";
    if (membership.roleCode === "owner_admin" && assuranceLevel !== "aal2") {
      throw new AuthenticatedMutationError("mfa_required");
    }

    return await withTenantContext(client, { tenantId: membership.tenantId, userId: identity.userId }, operation);
  } finally {
    await client.end();
  }
}
