import postgres from "postgres";
import { sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase, createSqlClient } from "@/db/client";
import { withTenantContext } from "@/db/tenant-context";
import { acceptInvitation, InvitationAcceptanceError } from "@/features/admin/invitation-acceptance";
import { createInvitation } from "@/features/admin/member-service";

const databaseUrl = process.env.DATABASE_URL;
const admin = databaseUrl ? postgres(databaseUrl, { max: 1, onnotice: () => undefined }) : undefined;
const tenantId = uuidv7();
const adminUserId = uuidv7();
const adminMembershipId = uuidv7();

beforeEach(async () => {
  if (!admin) return;
  await admin`TRUNCATE TABLE rate_limit_buckets, audit_events, invitations, memberships, users, tenant_settings, tenants CASCADE`;
  await admin`INSERT INTO tenants (id, legal_name, slug) VALUES (${tenantId}, 'Einladungs Test GmbH', 'einladungs-test')`;
  await admin`INSERT INTO tenant_settings (tenant_id) VALUES (${tenantId})`;
  await admin`INSERT INTO users (id, auth_subject, email) VALUES (${adminUserId}, 'accept-admin', 'admin@accept.example')`;
  await admin`INSERT INTO memberships (id, tenant_id, user_id, role_code) VALUES (${adminMembershipId}, ${tenantId}, ${adminUserId}, 'owner_admin')`;
});

afterAll(async () => admin?.end());

async function invitation(email = "neu@accept.example") {
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const client = createSqlClient(databaseUrl);
  try {
    return await withTenantContext(client, { tenantId, userId: adminUserId }, (database, context) =>
      createInvitation(database, context, { email, roleCode: "technician" })
    );
  } finally {
    await client.end();
  }
}

describe.skipIf(!admin)("invitation acceptance", () => {
  it("atomically creates the identity and membership and consumes the token", async () => {
    const created = await invitation();
    const result = await acceptInvitation({
      token: created.token,
      authSubject: "auth-new-user",
      email: "NEU@accept.example",
      displayName: "Neue Person"
    });

    const [membership] = await admin!`
      SELECT m.tenant_id, m.role_code, m.status, u.auth_subject, u.email
      FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.id = ${result.membershipId}
    `;
    const [accepted] = await admin!`SELECT accepted_at FROM invitations WHERE id = ${created.invitationId}`;
    const [audit] = await admin!`SELECT action FROM audit_events WHERE action = 'invitation.accepted'`;
    expect(membership).toMatchObject({
      tenant_id: tenantId,
      role_code: "technician",
      status: "active",
      auth_subject: "auth-new-user",
      email: "neu@accept.example"
    });
    expect(accepted.accepted_at).toBeInstanceOf(Date);
    expect(audit.action).toBe("invitation.accepted");
    await expect(
      acceptInvitation({ token: created.token, authSubject: "auth-new-user", email: "neu@accept.example" })
    ).rejects.toBeInstanceOf(InvitationAcceptanceError);
  });

  it("does not consume an invitation for another authenticated e-mail", async () => {
    const created = await invitation();
    await expect(
      acceptInvitation({ token: created.token, authSubject: "auth-attacker", email: "andere@accept.example" })
    ).rejects.toMatchObject({ code: "invalid" });
    const [row] = await admin!`SELECT accepted_at FROM invitations WHERE id = ${created.invitationId}`;
    expect(row.accepted_at).toBeNull();
  });

  it("rejects expired invitation tokens", async () => {
    const created = await invitation();
    await admin!`UPDATE invitations SET expires_at = now() - interval '1 minute' WHERE id = ${created.invitationId}`;
    await expect(
      acceptInvitation({ token: created.token, authSubject: "auth-new-user", email: "neu@accept.example" })
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("atomically refuses requests after the configured rate limit", async () => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    const client = createSqlClient(databaseUrl);
    try {
      const database = createDatabase(client);
      const allowed: boolean[] = [];
      for (let index = 0; index < 3; index += 1) {
        const rows = await database.transaction(async (transaction) => {
          await transaction.execute(sql.raw("SET LOCAL ROLE handwerker_app"));
          return transaction.execute(sql`
            SELECT app_private.consume_rate_limit(
              'login_email', ${"a".repeat(64)}, 2, 900
            ) AS allowed
          `);
        });
        allowed.push(rows[0]?.allowed === true);
      }
      expect(allowed).toEqual([true, true, false]);
    } finally {
      await client.end();
    }
  });
});
