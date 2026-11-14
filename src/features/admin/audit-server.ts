import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { hasPermission } from "@/auth/authorization";
import type { Database } from "@/db/client";
import { auditEvents, memberships, rolePermissions, users } from "@/db/schema";
import type { VerifiedTenantContext } from "@/db/tenant-context";
import { withAuthenticatedTenant } from "@/features/admin/authenticated-context";
import { loadAdminOverview } from "@/features/admin/server";

const pageSize = 20;

export type AuditEventView = Readonly<{
  id: string;
  action: string;
  actorName: string;
  targetType: string;
  targetId: string | null;
  outcome: "success" | "denied" | "failure";
  occurredAt: string;
}>;

export type AuditPageView = Readonly<{
  mode: "live" | "preview";
  tenantName: string;
  events: AuditEventView[];
  page: number;
  pageCount: number;
  total: number;
}>;

const previewEvents: AuditEventView[] = [
  {
    id: "preview-audit-1",
    action: "membership.role_changed",
    actorName: "Sebastian Hansen",
    targetType: "membership",
    targetId: "preview-member-2",
    outcome: "success",
    occurredAt: "2026-11-14T09:42:00.000Z"
  },
  {
    id: "preview-audit-2",
    action: "member.invited",
    actorName: "Sebastian Hansen",
    targetType: "invitation",
    targetId: "preview-invitation-1",
    outcome: "success",
    occurredAt: "2026-11-14T08:15:00.000Z"
  },
  {
    id: "preview-audit-3",
    action: "tenant.switched",
    actorName: "Sebastian Hansen",
    targetType: "tenant",
    targetId: "preview-hansen-shk",
    outcome: "success",
    occurredAt: "2026-11-14T07:55:00.000Z"
  }
];

export class AuditAccessError extends Error {
  constructor() {
    super("Für das Audit-Protokoll fehlt die Berechtigung.");
    this.name = "AuditAccessError";
  }
}

export async function queryTenantAudit(database: Database, context: VerifiedTenantContext, requestedPage: number) {
  const [grant] = await database
    .select({ permission: rolePermissions.permissionCode })
    .from(rolePermissions)
    .where(and(eq(rolePermissions.roleCode, context.roleCode), eq(rolePermissions.permissionCode, "audit.read")))
    .limit(1);
  if (!grant) throw new AuditAccessError();

  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [totalRow] = await database.select({ value: count() }).from(auditEvents);
  const total = totalRow.value;
  const pageCount = Math.ceil(total / pageSize);
  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);
  const rows = await database
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      actorName: users.displayName,
      actorEmail: users.email,
      targetType: auditEvents.targetType,
      targetId: auditEvents.targetId,
      outcome: auditEvents.outcome,
      occurredAt: auditEvents.occurredAt
    })
    .from(auditEvents)
    .leftJoin(memberships, eq(memberships.id, auditEvents.actorMembershipId))
    .leftJoin(users, eq(users.id, memberships.userId))
    .orderBy(desc(auditEvents.occurredAt), desc(auditEvents.id))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return {
    events: rows.map((event) => ({
      id: event.id,
      action: event.action,
      actorName: event.actorName ?? event.actorEmail ?? "System",
      targetType: event.targetType,
      targetId: event.targetId,
      outcome: event.outcome,
      occurredAt: event.occurredAt.toISOString()
    })),
    page: safePage,
    pageCount,
    total
  };
}

export async function loadAuditPage(requestedPage: number): Promise<AuditPageView> {
  const overview = await loadAdminOverview();
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  if (overview.mode === "preview") {
    return {
      mode: "preview",
      tenantName: overview.tenant.legalName,
      events: previewEvents,
      page: 1,
      pageCount: 1,
      total: previewEvents.length
    };
  }

  if (!hasPermission(overview.permissions, "audit.read")) {
    return { mode: "live", tenantName: overview.tenant.legalName, events: [], page: 1, pageCount: 0, total: 0 };
  }

  return withAuthenticatedTenant(async (database, context) => {
    const audit = await queryTenantAudit(database, context, page);
    return {
      mode: "live" as const,
      tenantName: overview.tenant.legalName,
      ...audit
    };
  });
}
