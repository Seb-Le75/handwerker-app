import postgres, { type TransactionSql } from "postgres";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createSqlClient } from "@/db/client";
import { tenantSettings } from "@/db/schema";
import { InvalidTenantContextError, withTenantContext } from "@/db/tenant-context";

const databaseUrl = process.env.DATABASE_URL;
const admin = databaseUrl ? postgres(databaseUrl, { max: 1, onnotice: () => undefined }) : undefined;

const tenantAId = uuidv7();
const tenantBId = uuidv7();
const userAId = uuidv7();
const userAColleagueId = uuidv7();
const userBId = uuidv7();
const membershipAId = uuidv7();
const membershipAColleagueId = uuidv7();
const membershipBId = uuidv7();
const invitationAId = uuidv7();
const invitationBId = uuidv7();
const auditAId = uuidv7();
const auditBId = uuidv7();

async function withAppContext<T>(
  tenantId: string,
  userId: string,
  operation: (transaction: TransactionSql) => Promise<T>
): Promise<T> {
  if (!admin) throw new Error("DATABASE_URL is required.");

  return admin.begin(async (transaction) => {
    await transaction.unsafe("SET LOCAL ROLE handwerker_app");
    await transaction`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    await transaction`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return operation(transaction);
  });
}

beforeAll(async () => {
  if (!admin) return;

  await admin`TRUNCATE TABLE audit_events, invitations, memberships, users, tenant_settings, tenants CASCADE`;

  await admin`
    INSERT INTO tenants (id, legal_name, slug)
    VALUES
      (${tenantAId}, 'Betrieb Alpha GmbH', 'betrieb-alpha'),
      (${tenantBId}, 'Betrieb Beta GmbH', 'betrieb-beta')
  `;
  await admin`
    INSERT INTO tenant_settings (tenant_id)
    VALUES (${tenantAId}), (${tenantBId})
  `;
  await admin`
    INSERT INTO users (id, auth_subject, email, display_name)
    VALUES
      (${userAId}, 'auth-user-a', 'admin@alpha.example', 'Alpha Admin'),
      (${userAColleagueId}, 'auth-user-a-colleague', 'office@alpha.example', 'Alpha Büro'),
      (${userBId}, 'auth-user-b', 'admin@beta.example', 'Beta Admin')
  `;
  await admin`
    INSERT INTO memberships (id, tenant_id, user_id, role_code)
    VALUES
      (${membershipAId}, ${tenantAId}, ${userAId}, 'owner_admin'),
      (${membershipAColleagueId}, ${tenantAId}, ${userAColleagueId}, 'office_dispatch'),
      (${membershipBId}, ${tenantBId}, ${userBId}, 'owner_admin')
  `;
  await admin`
    INSERT INTO invitations (
      id, tenant_id, invited_by_membership_id, email, role_code, token_digest, expires_at
    )
    VALUES
      (${invitationAId}, ${tenantAId}, ${membershipAId}, 'invite@alpha.example', 'technician', 'digest-alpha', now() + interval '1 day'),
      (${invitationBId}, ${tenantBId}, ${membershipBId}, 'invite@beta.example', 'technician', 'digest-beta', now() + interval '1 day')
  `;
  await admin`
    INSERT INTO audit_events (id, tenant_id, actor_membership_id, action, target_type, target_id, outcome)
    VALUES
      (${auditAId}, ${tenantAId}, ${membershipAId}, 'tenant.created', 'tenant', ${tenantAId}, 'success'),
      (${auditBId}, ${tenantBId}, ${membershipBId}, 'tenant.created', 'tenant', ${tenantBId}, 'success')
  `;
});

afterAll(async () => {
  await admin?.end();
});

describe.skipIf(!admin)("tenant isolation", () => {
  it("uses a least-privilege application role and forces RLS", async () => {
    const [role] = await admin!`
      SELECT rolcanlogin, rolinherit, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
      FROM pg_roles
      WHERE rolname = 'handwerker_app'
    `;

    expect(role).toEqual({
      rolcanlogin: false,
      rolinherit: false,
      rolsuper: false,
      rolcreaterole: false,
      rolcreatedb: false,
      rolbypassrls: false
    });

    const tables = await admin!`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname IN ('tenants', 'tenant_settings', 'users', 'memberships', 'invitations', 'audit_events')
      ORDER BY relname
    `;

    expect(tables).toHaveLength(6);
    expect(tables.every((table) => table.relrowsecurity && table.relforcerowsecurity)).toBe(true);
  });

  it("returns no tenant data without a bound context", async () => {
    const rows = await admin!.begin(async (transaction) => {
      await transaction.unsafe("SET LOCAL ROLE handwerker_app");
      return transaction`SELECT id FROM tenants`;
    });

    expect(rows).toEqual([]);
  });

  it("shows tenant A data and same-tenant users, but never tenant B", async () => {
    const result = await withAppContext(tenantAId, userAId, async (transaction) => {
      const tenants = await transaction`SELECT id FROM tenants ORDER BY id`;
      const settings = await transaction`SELECT tenant_id FROM tenant_settings ORDER BY tenant_id`;
      const memberships = await transaction`SELECT tenant_id, user_id FROM memberships ORDER BY user_id`;
      const users = await transaction`SELECT id FROM users ORDER BY id`;
      const invitations = await transaction`SELECT tenant_id FROM invitations ORDER BY id`;
      const auditEvents = await transaction`SELECT tenant_id FROM audit_events ORDER BY id`;
      return { tenants, settings, memberships, users, invitations, auditEvents };
    });

    expect(result.tenants.map((row) => row.id)).toEqual([tenantAId]);
    expect(result.settings.map((row) => row.tenant_id)).toEqual([tenantAId]);
    expect(result.memberships).toHaveLength(2);
    expect(result.memberships.every((row) => row.tenant_id === tenantAId)).toBe(true);
    expect(result.users.map((row) => row.id).sort()).toEqual([userAId, userAColleagueId].sort());
    expect(result.invitations.map((row) => row.tenant_id)).toEqual([tenantAId]);
    expect(result.auditEvents.map((row) => row.tenant_id)).toEqual([tenantAId]);
  });

  it("blocks cross-tenant insert, update, and delete operations", async () => {
    const foreignTenantId = uuidv7();

    await expect(
      withAppContext(tenantAId, userAId, async (transaction) => {
        await transaction`
          INSERT INTO tenants (id, legal_name, slug)
          VALUES (${foreignTenantId}, 'Fremder Betrieb', 'fremder-betrieb')
        `;
      })
    ).rejects.toMatchObject({ code: "42501" });

    const mutations = await withAppContext(tenantAId, userAId, async (transaction) => {
      const updated = await transaction`
        UPDATE tenants SET legal_name = 'Manipuliert' WHERE id = ${tenantBId} RETURNING id
      `;
      const deleted = await transaction`
        DELETE FROM invitations WHERE id = ${invitationBId} RETURNING id
      `;
      return { updated, deleted };
    });

    expect(mutations.updated).toEqual([]);
    expect(mutations.deleted).toEqual([]);
  });

  it("rejects tenant-inconsistent foreign keys", async () => {
    await expect(
      admin!`
        INSERT INTO invitations (
          tenant_id, invited_by_membership_id, email, role_code, token_digest, expires_at
        )
        VALUES (
          ${tenantAId}, ${membershipBId}, 'invalid@alpha.example', 'technician', 'invalid-digest', now() + interval '1 day'
        )
      `
    ).rejects.toMatchObject({ code: "23503" });
  });

  it("keeps audit events append-only for the application role", async () => {
    const insertedId = uuidv7();

    await withAppContext(tenantAId, userAId, async (transaction) => {
      await transaction`
        INSERT INTO audit_events (
          id, tenant_id, actor_membership_id, action, target_type, target_id, outcome
        )
        VALUES (
          ${insertedId}, ${tenantAId}, ${membershipAId}, 'membership.read', 'membership', ${membershipAId}, 'success'
        )
      `;
    });

    await expect(
      withAppContext(tenantAId, userAId, async (transaction) => {
        await transaction`UPDATE audit_events SET action = 'tampered' WHERE id = ${insertedId}`;
      })
    ).rejects.toMatchObject({ code: "42501" });

    await expect(
      withAppContext(tenantAId, userAId, async (transaction) => {
        await transaction`DELETE FROM audit_events WHERE id = ${insertedId}`;
      })
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("verifies membership before exposing a tenant-bound Drizzle transaction", async () => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    const client = createSqlClient(databaseUrl);

    try {
      const result = await withTenantContext(
        client,
        { tenantId: tenantAId, userId: userAId },
        async (database, context) => {
          const rows = await database.select().from(tenantSettings);
          return { rows, context };
        }
      );

      expect(result.context).toMatchObject({
        tenantId: tenantAId,
        userId: userAId,
        membershipId: membershipAId,
        roleCode: "owner_admin"
      });
      expect(result.rows.map((row) => row.tenantId)).toEqual([tenantAId]);

      await expect(
        withTenantContext(client, { tenantId: tenantBId, userId: userAId }, async () => undefined)
      ).rejects.toBeInstanceOf(InvalidTenantContextError);
    } finally {
      await client.end();
    }
  });
});
