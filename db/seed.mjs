import postgres from "postgres";

if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
  throw new Error("Database seeds are disabled in production.");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for database seeds.");

const sql = postgres(databaseUrl, { max: 1, onnotice: () => undefined });

const ids = {
  tenantHansen: "019a7d10-0000-7000-8000-000000000001",
  tenantNord: "019a7d10-0000-7000-8000-000000000002",
  userSharedAdmin: "019a7d10-0000-7000-8000-000000000101",
  userHansenTech: "019a7d10-0000-7000-8000-000000000102",
  userNordOffice: "019a7d10-0000-7000-8000-000000000103",
  membershipHansenAdmin: "019a7d10-0000-7000-8000-000000000201",
  membershipNordAdmin: "019a7d10-0000-7000-8000-000000000202",
  membershipHansenTech: "019a7d10-0000-7000-8000-000000000203",
  membershipNordOffice: "019a7d10-0000-7000-8000-000000000204"
};

try {
  await sql.begin(async (transaction) => {
    await transaction`
      INSERT INTO tenants (id, legal_name, slug)
      VALUES
        (${ids.tenantHansen}, 'Hansen Sanitär & Heizung GmbH', 'demo-hansen-shk'),
        (${ids.tenantNord}, 'Nord Service GmbH', 'demo-nord-service')
      ON CONFLICT (id) DO UPDATE SET legal_name = EXCLUDED.legal_name, updated_at = now()
    `;
    await transaction`
      INSERT INTO tenant_settings (tenant_id, timezone, locale)
      VALUES
        (${ids.tenantHansen}, 'Europe/Berlin', 'de-DE'),
        (${ids.tenantNord}, 'Europe/Berlin', 'de-DE')
      ON CONFLICT (tenant_id) DO UPDATE SET timezone = EXCLUDED.timezone, locale = EXCLUDED.locale, updated_at = now()
    `;
    await transaction`
      INSERT INTO users (id, auth_subject, email, display_name)
      VALUES
        (${ids.userSharedAdmin}, 'demo-shared-admin', 'admin@demo.handwerker.local', 'Demo Inhaber'),
        (${ids.userHansenTech}, 'demo-hansen-tech', 'technik@demo.handwerker.local', 'Demo Monteur'),
        (${ids.userNordOffice}, 'demo-nord-office', 'buero@demo.handwerker.local', 'Demo Disposition')
      ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now()
    `;
    await transaction`
      INSERT INTO memberships (id, tenant_id, user_id, role_code)
      VALUES
        (${ids.membershipHansenAdmin}, ${ids.tenantHansen}, ${ids.userSharedAdmin}, 'owner_admin'),
        (${ids.membershipNordAdmin}, ${ids.tenantNord}, ${ids.userSharedAdmin}, 'owner_admin'),
        (${ids.membershipHansenTech}, ${ids.tenantHansen}, ${ids.userHansenTech}, 'technician'),
        (${ids.membershipNordOffice}, ${ids.tenantNord}, ${ids.userNordOffice}, 'office_dispatch')
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET role_code = EXCLUDED.role_code, status = 'active', deactivated_at = NULL, updated_at = now()
    `;
  });

  console.log("Seeded two isolated demo tenants. Auth subjects are local placeholders; no passwords were created.");
} finally {
  await sql.end();
}
