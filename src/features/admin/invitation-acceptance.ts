import "server-only";

import { createHash } from "node:crypto";

import { sql } from "drizzle-orm";

import { createDatabase, createSqlClient } from "@/db/client";

export class InvitationAcceptanceError extends Error {
  constructor(readonly code: "invalid" | "configuration") {
    super(code);
    this.name = "InvitationAcceptanceError";
  }
}

export async function acceptInvitation(input: {
  token: string;
  authSubject: string;
  email: string;
  displayName?: string | null;
}) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(input.token)) throw new InvitationAcceptanceError("invalid");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new InvitationAcceptanceError("configuration");

  const tokenDigest = createHash("sha256").update(input.token).digest("hex");
  const client = createSqlClient(databaseUrl);
  try {
    const database = createDatabase(client);
    const rows = await database.transaction(async (transaction) => {
      await transaction.execute(sql.raw("SET LOCAL ROLE handwerker_app"));
      return transaction.execute(sql`
        SELECT tenant_id, membership_id, invitation_id
        FROM app_private.accept_invitation(
          ${tokenDigest}, ${input.authSubject}, ${input.email}, ${input.displayName ?? null}
        )
      `);
    });
    const accepted = rows[0];
    if (!accepted) throw new InvitationAcceptanceError("invalid");
    return {
      tenantId: String(accepted.tenant_id),
      membershipId: String(accepted.membership_id),
      invitationId: String(accepted.invitation_id)
    };
  } catch (error) {
    if (error instanceof InvitationAcceptanceError) throw error;
    throw new InvitationAcceptanceError("invalid");
  } finally {
    await client.end();
  }
}
