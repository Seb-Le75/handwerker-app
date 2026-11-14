import { createHash } from "node:crypto";

import postgres from "postgres";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createSqlClient } from "@/db/client";
import { withTenantContext } from "@/db/tenant-context";
import {
  changeMemberRole,
  createInvitation,
  disableMember,
  MemberManagementError,
  revokeInvitation
} from "@/features/admin/member-service";

const databaseUrl = process.env.DATABASE_URL;
const admin = databaseUrl ? postgres(databaseUrl, { max: 1, onnotice: () => undefined }) : undefined;

const tenantId = uuidv7();
const adminUserId = uuidv7();
const technicianUserId = uuidv7();
const secondAdminUserId = uuidv7();
const adminMembershipId = uuidv7();
const technicianMembershipId = uuidv7();
const secondAdminMembershipId = uuidv7();

beforeEach(async () => {
  if (!admin) return;
  await admin`TRUNCATE TABLE audit_events, invitations, memberships, users, tenant_settings, tenants CASCADE`;
  await admin`INSERT INTO tenants (id, legal_name, slug) VALUES (${tenantId}, 'Mitglieder Test GmbH', 'mitglieder-test')`;
  await admin`INSERT INTO tenant_settings (tenant_id) VALUES (${tenantId})`;
  await admin`
    INSERT INTO users (id, auth_subject, email, display_name)
    VALUES
      (${adminUserId}, 'member-admin', 'admin@members.example', 'Admin'),
      (${technicianUserId}, 'member-technician', 'technik@members.example', 'Technik'),
      (${secondAdminUserId}, 'member-second-admin', 'zweiter-admin@members.example', 'Zweiter Admin')
  `;
  await admin`
    INSERT INTO memberships (id, tenant_id, user_id, role_code)
    VALUES
      (${adminMembershipId}, ${tenantId}, ${adminUserId}, 'owner_admin'),
      (${technicianMembershipId}, ${tenantId}, ${technicianUserId}, 'technician')
  `;
});

afterAll(async () => {
  await admin?.end();
});

async function asMember<T>(userId: string, operation: Parameters<typeof withTenantContext<T>>[2]): Promise<T> {
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const client = createSqlClient(databaseUrl);
  try {
    return await withTenantContext(client, { tenantId, userId }, operation);
  } finally {
    await client.end();
  }
}

describe.skipIf(!admin)("member management", () => {
  it("stores only the invitation digest and writes an audit event", async () => {
    const result = await asMember(adminUserId, (database, context) =>
      createInvitation(database, context, { email: "  NEU@Members.Example ", roleCode: "master" })
    );

    const [invitation] = await admin!`SELECT email, token_digest FROM invitations WHERE id = ${result.invitationId}`;
    const [audit] =
      await admin!`SELECT action, target_id, metadata FROM audit_events WHERE target_id = ${result.invitationId}`;

    expect(invitation.email).toBe("neu@members.example");
    expect(invitation.token_digest).toBe(createHash("sha256").update(result.token).digest("hex"));
    expect(invitation.token_digest).not.toContain(result.token);
    expect(audit).toMatchObject({
      action: "member.invited",
      target_id: result.invitationId,
      metadata: { roleCode: "master" }
    });
  });

  it("rejects duplicate pending invitations", async () => {
    await asMember(adminUserId, (database, context) =>
      createInvitation(database, context, { email: "neu@members.example", roleCode: "master" })
    );

    await expect(
      asMember(adminUserId, (database, context) =>
        createInvitation(database, context, { email: "neu@members.example", roleCode: "technician" })
      )
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("revokes an invitation and permits a fresh invitation for the same address", async () => {
    const original = await asMember(adminUserId, (database, context) =>
      createInvitation(database, context, { email: "neu@members.example", roleCode: "master" })
    );
    await asMember(adminUserId, (database, context) => revokeInvitation(database, context, original.invitationId));
    const replacement = await asMember(adminUserId, (database, context) =>
      createInvitation(database, context, { email: "neu@members.example", roleCode: "technician" })
    );

    const [revoked] = await admin!`SELECT revoked_at, version FROM invitations WHERE id = ${original.invitationId}`;
    const [audit] =
      await admin!`SELECT action FROM audit_events WHERE target_id = ${original.invitationId} AND action = 'invitation.revoked'`;
    expect(revoked.revoked_at).toBeInstanceOf(Date);
    expect(revoked.version).toBe(2);
    expect(replacement.invitationId).not.toBe(original.invitationId);
    expect(audit.action).toBe("invitation.revoked");
  });

  it("audits a role change and denies it to an unprivileged member", async () => {
    await expect(
      asMember(technicianUserId, (database, context) =>
        changeMemberRole(database, context, technicianMembershipId, "master")
      )
    ).rejects.toMatchObject({ code: "forbidden" });

    await asMember(adminUserId, (database, context) =>
      changeMemberRole(database, context, technicianMembershipId, "master")
    );

    const [membership] = await admin!`SELECT role_code, version FROM memberships WHERE id = ${technicianMembershipId}`;
    const [audit] = await admin!`SELECT action, metadata FROM audit_events WHERE target_id = ${technicianMembershipId}`;
    expect(membership).toMatchObject({ role_code: "master", version: 2 });
    expect(audit).toMatchObject({ action: "membership.role_changed", metadata: { from: "technician", to: "master" } });
  });

  it("protects the last active admin during role change and deactivation", async () => {
    await expect(
      asMember(adminUserId, (database, context) =>
        changeMemberRole(database, context, adminMembershipId, "office_dispatch")
      )
    ).rejects.toBeInstanceOf(MemberManagementError);
    await expect(
      asMember(adminUserId, (database, context) => disableMember(database, context, adminMembershipId))
    ).rejects.toMatchObject({ code: "last_admin" });

    await admin!`
      INSERT INTO memberships (id, tenant_id, user_id, role_code)
      VALUES (${secondAdminMembershipId}, ${tenantId}, ${secondAdminUserId}, 'owner_admin')
    `;
    await asMember(adminUserId, (database, context) => disableMember(database, context, adminMembershipId));

    const [membership] = await admin!`
      SELECT status, deactivated_at IS NOT NULL AS has_deactivated_at
      FROM memberships
      WHERE id = ${adminMembershipId}
    `;
    expect(membership).toEqual({ status: "disabled", has_deactivated_at: true });
  });
});
