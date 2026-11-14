import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, eq, isNull, sql } from "drizzle-orm";

import type { PermissionCode } from "@/auth/authorization";
import type { Database } from "@/db/client";
import { auditEvents, invitations, memberships, rolePermissions, roles } from "@/db/schema";
import type { VerifiedTenantContext } from "@/db/tenant-context";

export const assignableRoleCodes = [
  "owner_admin",
  "office_dispatch",
  "master",
  "technician",
  "accounting",
  "read_only"
] as const;

export type AssignableRoleCode = (typeof assignableRoleCodes)[number];

export class MemberManagementError extends Error {
  constructor(
    message: string,
    readonly code: "forbidden" | "not_found" | "last_admin" | "conflict"
  ) {
    super(message);
    this.name = "MemberManagementError";
  }
}

async function requirePermission(database: Database, roleCode: string, permission: PermissionCode) {
  const [grant] = await database
    .select({ permission: rolePermissions.permissionCode })
    .from(rolePermissions)
    .where(and(eq(rolePermissions.roleCode, roleCode), eq(rolePermissions.permissionCode, permission)))
    .limit(1);

  if (!grant) throw new MemberManagementError("Für diese Aktion fehlt die Berechtigung.", "forbidden");
}

async function lockTenantMemberships(database: Database, tenantId: string) {
  await database.execute(sql`
    SELECT id
    FROM memberships
    WHERE tenant_id = ${tenantId}
    FOR UPDATE
  `);
}

async function requireMember(database: Database, context: VerifiedTenantContext, membershipId: string) {
  const [member] = await database
    .select({
      id: memberships.id,
      roleCode: memberships.roleCode,
      status: memberships.status
    })
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, context.tenantId)))
    .limit(1);

  if (!member) throw new MemberManagementError("Mitgliedschaft nicht gefunden.", "not_found");
  return member;
}

async function assertAnotherActiveAdmin(database: Database, context: VerifiedTenantContext, membershipId: string) {
  const otherAdmins = await database
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.tenantId, context.tenantId),
        eq(memberships.roleCode, "owner_admin"),
        eq(memberships.status, "active")
      )
    );

  if (!otherAdmins.some((member) => member.id !== membershipId)) {
    throw new MemberManagementError("Der letzte aktive Inhaber/Admin muss erhalten bleiben.", "last_admin");
  }
}

export async function createInvitation(
  database: Database,
  context: VerifiedTenantContext,
  input: { email: string; roleCode: AssignableRoleCode; expiresAt?: Date }
) {
  await requirePermission(database, context.roleCode, "members.invite");

  const [role] = await database
    .select({ code: roles.code })
    .from(roles)
    .where(and(eq(roles.code, input.roleCode), eq(roles.isSystem, true)))
    .limit(1);
  if (!role) throw new MemberManagementError("Rolle nicht gefunden.", "not_found");

  const email = input.email.trim().toLowerCase();
  const [pendingInvitation] = await database
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.tenantId, context.tenantId),
        eq(invitations.email, email),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt)
      )
    )
    .limit(1);
  if (pendingInvitation) {
    throw new MemberManagementError("Für diese E-Mail-Adresse besteht bereits eine offene Einladung.", "conflict");
  }

  const token = randomBytes(32).toString("base64url");
  const tokenDigest = createHash("sha256").update(token).digest("hex");
  const expiresAt = input.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [invitation] = await database
    .insert(invitations)
    .values({
      tenantId: context.tenantId,
      invitedByMembershipId: context.membershipId,
      email,
      roleCode: input.roleCode,
      tokenDigest,
      expiresAt
    })
    .returning({ id: invitations.id, expiresAt: invitations.expiresAt });

  await database.insert(auditEvents).values({
    tenantId: context.tenantId,
    actorMembershipId: context.membershipId,
    action: "member.invited",
    targetType: "invitation",
    targetId: invitation.id,
    outcome: "success",
    metadata: { roleCode: input.roleCode }
  });

  return { invitationId: invitation.id, token, expiresAt: invitation.expiresAt };
}

export async function changeMemberRole(
  database: Database,
  context: VerifiedTenantContext,
  membershipId: string,
  nextRoleCode: AssignableRoleCode
) {
  await requirePermission(database, context.roleCode, "members.role.assign");
  await lockTenantMemberships(database, context.tenantId);
  const member = await requireMember(database, context, membershipId);
  if (member.status !== "active")
    throw new MemberManagementError("Deaktivierte Zugänge können nicht geändert werden.", "conflict");

  const [role] = await database
    .select({ code: roles.code })
    .from(roles)
    .where(and(eq(roles.code, nextRoleCode), eq(roles.isSystem, true)))
    .limit(1);
  if (!role) throw new MemberManagementError("Rolle nicht gefunden.", "not_found");
  if (member.roleCode === nextRoleCode) return;
  if (member.roleCode === "owner_admin" && nextRoleCode !== "owner_admin") {
    await assertAnotherActiveAdmin(database, context, membershipId);
  }

  await database
    .update(memberships)
    .set({ roleCode: nextRoleCode, updatedAt: new Date(), version: sql`${memberships.version} + 1` })
    .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, context.tenantId)));
  await database.insert(auditEvents).values({
    tenantId: context.tenantId,
    actorMembershipId: context.membershipId,
    action: "membership.role_changed",
    targetType: "membership",
    targetId: membershipId,
    outcome: "success",
    metadata: { from: member.roleCode, to: nextRoleCode }
  });
}

export async function disableMember(database: Database, context: VerifiedTenantContext, membershipId: string) {
  await requirePermission(database, context.roleCode, "members.disable");
  await lockTenantMemberships(database, context.tenantId);
  const member = await requireMember(database, context, membershipId);
  if (member.status === "disabled") return;
  if (member.roleCode === "owner_admin") await assertAnotherActiveAdmin(database, context, membershipId);

  const now = new Date();
  await database
    .update(memberships)
    .set({ status: "disabled", deactivatedAt: now, updatedAt: now, version: sql`${memberships.version} + 1` })
    .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, context.tenantId)));
  await database.insert(auditEvents).values({
    tenantId: context.tenantId,
    actorMembershipId: context.membershipId,
    action: "membership.disabled",
    targetType: "membership",
    targetId: membershipId,
    outcome: "success",
    metadata: { previousRole: member.roleCode }
  });
}

export async function revokeInvitation(database: Database, context: VerifiedTenantContext, invitationId: string) {
  await requirePermission(database, context.roleCode, "members.invite");
  await database.execute(sql`
    SELECT id
    FROM invitations
    WHERE tenant_id = ${context.tenantId} AND id = ${invitationId}
    FOR UPDATE
  `);

  const [invitation] = await database
    .select({ id: invitations.id, acceptedAt: invitations.acceptedAt, revokedAt: invitations.revokedAt })
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), eq(invitations.tenantId, context.tenantId)))
    .limit(1);
  if (!invitation) throw new MemberManagementError("Einladung nicht gefunden.", "not_found");
  if (invitation.acceptedAt)
    throw new MemberManagementError("Angenommene Einladungen können nicht widerrufen werden.", "conflict");
  if (invitation.revokedAt) return;

  await database
    .update(invitations)
    .set({ revokedAt: new Date(), version: sql`${invitations.version} + 1` })
    .where(and(eq(invitations.id, invitationId), eq(invitations.tenantId, context.tenantId)));
  await database.insert(auditEvents).values({
    tenantId: context.tenantId,
    actorMembershipId: context.membershipId,
    action: "invitation.revoked",
    targetType: "invitation",
    targetId: invitationId,
    outcome: "success",
    metadata: {}
  });
}
