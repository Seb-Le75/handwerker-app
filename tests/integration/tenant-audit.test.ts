import postgres from "postgres";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createSqlClient } from "@/db/client";
import { withTenantContext } from "@/db/tenant-context";
import { AuditAccessError, queryTenantAudit } from "@/features/admin/audit-server";
import { recordTenantSwitch } from "@/features/admin/tenant-switch-service";

const databaseUrl = process.env.DATABASE_URL;
const admin = databaseUrl ? postgres(databaseUrl, { max: 1, onnotice: () => undefined }) : undefined;

const tenantAId = uuidv7();
const tenantBId = uuidv7();
const sharedUserId = uuidv7();
const officeUserId = uuidv7();
const adminMembershipAId = uuidv7();
const adminMembershipBId = uuidv7();
const officeMembershipId = uuidv7();

beforeEach(async () => {
  if (!admin) return;
  await admin`TRUNCATE TABLE audit_events, invitations, memberships, users, tenant_settings, tenants CASCADE`;
  await admin`
    INSERT INTO tenants (id, legal_name, slug)
    VALUES (${tenantAId}, 'Audit Alpha GmbH', 'audit-alpha'), (${tenantBId}, 'Audit Beta GmbH', 'audit-beta')
  `;
  await admin`INSERT INTO tenant_settings (tenant_id) VALUES (${tenantAId}), (${tenantBId})`;
  await admin`
    INSERT INTO users (id, auth_subject, email, display_name)
    VALUES
      (${sharedUserId}, 'audit-shared', 'admin@audit.example', 'Audit Admin'),
      (${officeUserId}, 'audit-office', 'office@audit.example', 'Audit Büro')
  `;
  await admin`
    INSERT INTO memberships (id, tenant_id, user_id, role_code)
    VALUES
      (${adminMembershipAId}, ${tenantAId}, ${sharedUserId}, 'owner_admin'),
      (${adminMembershipBId}, ${tenantBId}, ${sharedUserId}, 'owner_admin'),
      (${officeMembershipId}, ${tenantAId}, ${officeUserId}, 'office_dispatch')
  `;

  for (let index = 0; index < 25; index += 1) {
    await admin`
      INSERT INTO audit_events (tenant_id, actor_membership_id, action, target_type, target_id, outcome, occurred_at)
      VALUES (${tenantAId}, ${adminMembershipAId}, 'test.alpha', 'test', ${String(index)}, 'success', now() - ${index} * interval '1 minute')
    `;
  }
  await admin`
    INSERT INTO audit_events (tenant_id, actor_membership_id, action, target_type, target_id, outcome)
    VALUES (${tenantBId}, ${adminMembershipBId}, 'test.beta', 'test', 'foreign', 'success')
  `;
});

afterAll(async () => {
  await admin?.end();
});

async function asTenant<T>(tenantId: string, userId: string, operation: Parameters<typeof withTenantContext<T>>[2]) {
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const client = createSqlClient(databaseUrl);
  try {
    return await withTenantContext(client, { tenantId, userId }, operation);
  } finally {
    await client.end();
  }
}

describe.skipIf(!admin)("tenant switch and audit", () => {
  it("paginates only the active tenant's audit events", async () => {
    const firstPage = await asTenant(tenantAId, sharedUserId, (database, context) =>
      queryTenantAudit(database, context, 1)
    );
    const secondPage = await asTenant(tenantAId, sharedUserId, (database, context) =>
      queryTenantAudit(database, context, 2)
    );

    expect(firstPage).toMatchObject({ page: 1, pageCount: 2, total: 25 });
    expect(firstPage.events).toHaveLength(20);
    expect(secondPage.events).toHaveLength(5);
    expect([...firstPage.events, ...secondPage.events].every((event) => event.action === "test.alpha")).toBe(true);
  });

  it("denies the audit view without audit.read", async () => {
    await expect(
      asTenant(tenantAId, officeUserId, (database, context) => queryTenantAudit(database, context, 1))
    ).rejects.toBeInstanceOf(AuditAccessError);
  });

  it("records the tenant switch only inside the validated target tenant", async () => {
    await asTenant(tenantBId, sharedUserId, recordTenantSwitch);

    const [targetCount] = await admin!`
      SELECT count(*)::integer AS value
      FROM audit_events
      WHERE tenant_id = ${tenantBId} AND action = 'tenant.switched'
    `;
    const [sourceCount] = await admin!`
      SELECT count(*)::integer AS value
      FROM audit_events
      WHERE tenant_id = ${tenantAId} AND action = 'tenant.switched'
    `;
    expect(targetCount.value).toBe(1);
    expect(sourceCount.value).toBe(0);
  });
});
