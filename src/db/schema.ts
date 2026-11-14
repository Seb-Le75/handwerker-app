import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgRole,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const applicationRole = pgRole("handwerker_app").existing();

const uuidV7 = (name: string) => uuid(name).default(sql`uuidv7()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const version = () => integer("version").notNull().default(1);
const currentTenantId = sql`app_private.current_tenant_id()`;
const currentUserId = sql`app_private.current_user_id()`;
const currentAuthSubject = sql`app_private.current_auth_subject()`;

export const roles = pgTable("roles", {
  code: text("code").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  isSystem: boolean("is_system").notNull().default(true)
});

export const permissions = pgTable("permissions", {
  code: text("code").primaryKey(),
  description: text("description").notNull()
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleCode: text("role_code")
      .notNull()
      .references(() => roles.code, { onDelete: "cascade" }),
    permissionCode: text("permission_code")
      .notNull()
      .references(() => permissions.code, { onDelete: "cascade" })
  },
  (table) => [primaryKey({ columns: [table.roleCode, table.permissionCode] })]
);

export const tenants = pgTable(
  "tenants",
  {
    id: uuidV7("id").primaryKey(),
    legalName: text("legal_name").notNull(),
    slug: text("slug").notNull(),
    status: text("status", { enum: ["active", "suspended", "deletion_pending"] })
      .notNull()
      .default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    version: version()
  },
  (table) => [
    unique("tenants_slug_unique").on(table.slug),
    check("tenants_version_positive", sql`${table.version} > 0`),
    pgPolicy("tenants_isolation", {
      for: "all",
      to: applicationRole,
      using: sql`${table.id} = ${currentTenantId}`,
      withCheck: sql`${table.id} = ${currentTenantId}`
    })
  ]
).enableRLS();

export const tenantSettings = pgTable(
  "tenant_settings",
  {
    tenantId: uuid("tenant_id")
      .primaryKey()
      .references(() => tenants.id, { onDelete: "cascade" }),
    timezone: text("timezone").notNull().default("Europe/Berlin"),
    locale: text("locale").notNull().default("de-DE"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    version: version()
  },
  (table) => [
    check("tenant_settings_version_positive", sql`${table.version} > 0`),
    pgPolicy("tenant_settings_isolation", {
      for: "all",
      to: applicationRole,
      using: sql`${table.tenantId} = ${currentTenantId}`,
      withCheck: sql`${table.tenantId} = ${currentTenantId}`
    })
  ]
).enableRLS();

export const users = pgTable(
  "users",
  {
    id: uuidV7("id").primaryKey(),
    authSubject: text("auth_subject").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    status: text("status", { enum: ["active", "disabled"] })
      .notNull()
      .default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    version: version()
  },
  (table) => [
    unique("users_auth_subject_unique").on(table.authSubject),
    unique("users_email_unique").on(table.email),
    check("users_email_normalized", sql`${table.email} = lower(btrim(${table.email}))`),
    check("users_version_positive", sql`${table.version} > 0`),
    pgPolicy("users_current_identity", {
      for: "select",
      to: applicationRole,
      using: sql`${table.id} = ${currentUserId}`
    }),
    pgPolicy("users_current_auth_subject", {
      for: "select",
      to: applicationRole,
      using: sql`${table.authSubject} = ${currentAuthSubject}`
    }),
    pgPolicy("users_same_tenant", {
      for: "select",
      to: applicationRole,
      using: sql`EXISTS (
        SELECT 1
        FROM memberships
        WHERE memberships.tenant_id = ${currentTenantId}
          AND memberships.user_id = ${table.id}
          AND memberships.status = 'active'
      )`
    })
  ]
).enableRLS();

export const memberships = pgTable(
  "memberships",
  {
    id: uuidV7("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    roleCode: text("role_code")
      .notNull()
      .references(() => roles.code, { onDelete: "restrict" }),
    status: text("status", { enum: ["active", "disabled"] })
      .notNull()
      .default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
    version: version()
  },
  (table) => [
    unique("memberships_tenant_user_unique").on(table.tenantId, table.userId),
    unique("memberships_tenant_id_unique").on(table.tenantId, table.id),
    index("memberships_user_status_idx").on(table.userId, table.status),
    index("memberships_tenant_role_status_idx").on(table.tenantId, table.roleCode, table.status),
    check("memberships_version_positive", sql`${table.version} > 0`),
    check(
      "memberships_deactivation_consistent",
      sql`(${table.status} = 'active' AND ${table.deactivatedAt} IS NULL)
        OR (${table.status} = 'disabled' AND ${table.deactivatedAt} IS NOT NULL)`
    ),
    pgPolicy("memberships_isolation", {
      for: "all",
      to: applicationRole,
      using: sql`${table.tenantId} = ${currentTenantId}`,
      withCheck: sql`${table.tenantId} = ${currentTenantId}`
    }),
    pgPolicy("memberships_current_identity", {
      for: "select",
      to: applicationRole,
      using: sql`${table.userId} = ${currentUserId}`
    })
  ]
).enableRLS();

export const invitations = pgTable(
  "invitations",
  {
    id: uuidV7("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitedByMembershipId: uuid("invited_by_membership_id").notNull(),
    email: text("email").notNull(),
    roleCode: text("role_code")
      .notNull()
      .references(() => roles.code, { onDelete: "restrict" }),
    tokenDigest: text("token_digest").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
    version: version()
  },
  (table) => [
    unique("invitations_tenant_id_unique").on(table.tenantId, table.id),
    unique("invitations_token_digest_unique").on(table.tokenDigest),
    index("invitations_tenant_email_idx").on(table.tenantId, table.email),
    uniqueIndex("invitations_one_pending_per_tenant_email")
      .on(table.tenantId, table.email)
      .where(sql`${table.acceptedAt} IS NULL AND ${table.revokedAt} IS NULL`),
    foreignKey({
      columns: [table.tenantId, table.invitedByMembershipId],
      foreignColumns: [memberships.tenantId, memberships.id],
      name: "invitations_inviter_tenant_fk"
    }).onDelete("restrict"),
    check("invitations_email_normalized", sql`${table.email} = lower(btrim(${table.email}))`),
    check("invitations_version_positive", sql`${table.version} > 0`),
    check(
      "invitations_single_terminal_state",
      sql`NOT (${table.acceptedAt} IS NOT NULL AND ${table.revokedAt} IS NOT NULL)`
    ),
    pgPolicy("invitations_isolation", {
      for: "all",
      to: applicationRole,
      using: sql`${table.tenantId} = ${currentTenantId}`,
      withCheck: sql`${table.tenantId} = ${currentTenantId}`
    })
  ]
).enableRLS();

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuidV7("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    actorMembershipId: uuid("actor_membership_id"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    outcome: text("outcome", { enum: ["success", "denied", "failure"] }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("audit_events_tenant_occurred_idx").on(table.tenantId, table.occurredAt),
    foreignKey({
      columns: [table.tenantId, table.actorMembershipId],
      foreignColumns: [memberships.tenantId, memberships.id],
      name: "audit_events_actor_tenant_fk"
    }).onDelete("restrict"),
    pgPolicy("audit_events_select", {
      for: "select",
      to: applicationRole,
      using: sql`${table.tenantId} = ${currentTenantId}`
    }),
    pgPolicy("audit_events_insert", {
      for: "insert",
      to: applicationRole,
      withCheck: sql`${table.tenantId} = ${currentTenantId}`
    })
  ]
).enableRLS();

export const schema = {
  auditEvents,
  invitations,
  memberships,
  permissions,
  rolePermissions,
  roles,
  tenantSettings,
  tenants,
  users
};

export type Tenant = typeof tenants.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
