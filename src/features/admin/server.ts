import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { permissionCodes, type PermissionCode } from "@/auth/authorization";
import { createSqlClient } from "@/db/client";
import { resolveIdentity } from "@/db/identity-context";
import { memberships, rolePermissions, roles, tenants, tenantSettings, users } from "@/db/schema";
import { withTenantContext } from "@/db/tenant-context";
import { previewAdminOverview } from "@/features/admin/preview-data";
import type { AdminOverview } from "@/features/admin/types";
import { readSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const activeTenantCookie = "hw_active_tenant";

export async function loadAdminOverview(): Promise<AdminOverview> {
  const supabaseConfig = readSupabasePublicConfig();

  if (!supabaseConfig && process.env.NODE_ENV !== "production") return previewAdminOverview;
  if (!supabaseConfig) redirect("/login?configuration=missing");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;
  if (error || !subject) redirect("/login");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for the authenticated admin area.");

  const sqlClient = createSqlClient(databaseUrl);
  try {
    const identity = await resolveIdentity(sqlClient, subject);
    if (!identity || identity.memberships.length === 0) redirect("/login?account=unassigned");

    const cookieStore = await cookies();
    const requestedTenantId = cookieStore.get(activeTenantCookie)?.value;
    const selectedMembership =
      identity.memberships.find((membership) => membership.tenantId === requestedTenantId) ?? identity.memberships[0];

    const assuranceLevel = typeof data.claims.aal === "string" ? data.claims.aal : "aal1";
    if (selectedMembership.roleCode === "owner_admin" && assuranceLevel !== "aal2") redirect("/mfa");

    const overview = await withTenantContext(
      sqlClient,
      { tenantId: selectedMembership.tenantId, userId: identity.userId },
      async (database, context) => {
        const [tenant] = await database
          .select({
            id: tenants.id,
            legalName: tenants.legalName,
            slug: tenants.slug,
            timezone: tenantSettings.timezone,
            locale: tenantSettings.locale
          })
          .from(tenants)
          .innerJoin(tenantSettings, eq(tenantSettings.tenantId, tenants.id))
          .where(eq(tenants.id, context.tenantId))
          .limit(1);

        const memberRows = await database
          .select({
            id: memberships.id,
            name: users.displayName,
            email: users.email,
            roleCode: memberships.roleCode,
            roleLabel: roles.label,
            status: memberships.status
          })
          .from(memberships)
          .innerJoin(users, eq(users.id, memberships.userId))
          .innerJoin(roles, eq(roles.code, memberships.roleCode))
          .where(eq(memberships.tenantId, context.tenantId));

        const granted = await database
          .select({ code: rolePermissions.permissionCode })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleCode, context.roleCode));

        const [viewerRole] = await database
          .select({ label: roles.label })
          .from(roles)
          .where(and(eq(roles.code, context.roleCode), eq(roles.isSystem, true)))
          .limit(1);

        if (!tenant || !viewerRole) throw new Error("The active tenant or role could not be loaded.");

        return {
          mode: "live" as const,
          tenant,
          viewer: {
            name: identity.displayName ?? identity.email,
            email: identity.email,
            roleCode: context.roleCode,
            roleLabel: viewerRole.label,
            assuranceLevel
          },
          tenants: identity.memberships.map((membership) => ({
            id: membership.tenantId,
            name: membership.tenantId === tenant.id ? tenant.legalName : "Weiterer Betrieb",
            roleCode: membership.roleCode
          })),
          permissions: granted
            .map(({ code }) => code)
            .filter((code): code is PermissionCode => permissionCodes.includes(code as PermissionCode)),
          members: memberRows.map((member) => ({ ...member, name: member.name ?? member.email }))
        };
      }
    );

    return overview;
  } finally {
    await sqlClient.end();
  }
}
