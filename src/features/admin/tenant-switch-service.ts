import "server-only";

import type { Database } from "@/db/client";
import { auditEvents } from "@/db/schema";
import { withTenantContext, type VerifiedTenantContext } from "@/db/tenant-context";
import { AuthenticatedMutationError, withAuthenticatedIdentity } from "@/features/admin/authenticated-context";

export async function recordTenantSwitch(database: Database, context: VerifiedTenantContext) {
  await database.insert(auditEvents).values({
    tenantId: context.tenantId,
    actorMembershipId: context.membershipId,
    action: "tenant.switched",
    targetType: "tenant",
    targetId: context.tenantId,
    outcome: "success",
    metadata: { source: "admin_ui" }
  });
}

export async function switchActiveTenant(tenantId: string) {
  return withAuthenticatedIdentity(async (client, { identity, assuranceLevel }) => {
    const membership = identity.memberships.find((candidate) => candidate.tenantId === tenantId);
    if (!membership) throw new AuthenticatedMutationError("unassigned");
    if (membership.roleCode === "owner_admin" && assuranceLevel !== "aal2") {
      throw new AuthenticatedMutationError("mfa_required");
    }

    await withTenantContext(client, { tenantId, userId: identity.userId }, recordTenantSwitch);

    return { tenantId };
  });
}
