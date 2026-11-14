import "server-only";

import { cookies } from "next/headers";

import type { Database, SqlClient } from "@/db/client";
import { createSqlClient } from "@/db/client";
import { resolveIdentity, type ResolvedIdentity } from "@/db/identity-context";
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

export type AuthenticatedIdentity = Readonly<{
  identity: ResolvedIdentity;
  assuranceLevel: string;
}>;

export async function withAuthenticatedIdentity<T>(
  operation: (client: SqlClient, authenticated: AuthenticatedIdentity) => Promise<T>
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
    const assuranceLevel = typeof data.claims.aal === "string" ? data.claims.aal : "aal1";
    return await operation(client, { identity, assuranceLevel });
  } finally {
    await client.end();
  }
}

export async function withAuthenticatedTenant<T>(
  operation: (database: Database, context: VerifiedTenantContext) => Promise<T>
) {
  return withAuthenticatedIdentity(async (client, { identity, assuranceLevel }) => {
    const requestedTenantId = (await cookies()).get(activeTenantCookie)?.value;
    const membership =
      identity.memberships.find((candidate) => candidate.tenantId === requestedTenantId) ?? identity.memberships[0];
    if (membership.roleCode === "owner_admin" && assuranceLevel !== "aal2") {
      throw new AuthenticatedMutationError("mfa_required");
    }

    return await withTenantContext(client, { tenantId: membership.tenantId, userId: identity.userId }, operation);
  });
}
