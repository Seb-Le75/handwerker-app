import { eq, sql } from "drizzle-orm";

import { createDatabase, type SqlClient } from "@/db/client";
import { memberships, users } from "@/db/schema";

export type IdentityMembership = Readonly<{
  membershipId: string;
  tenantId: string;
  roleCode: string;
}>;

export type ResolvedIdentity = Readonly<{
  userId: string;
  email: string;
  displayName: string | null;
  memberships: IdentityMembership[];
}>;

export async function resolveIdentity(client: SqlClient, authSubject: string): Promise<ResolvedIdentity | null> {
  const database = createDatabase(client);

  return database.transaction(async (transaction) => {
    await transaction.execute(sql.raw("SET LOCAL ROLE handwerker_app"));
    await transaction.execute(sql`SELECT set_config('app.current_auth_subject', ${authSubject}, true)`);

    const [identity] = await transaction
      .select({ id: users.id, email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.authSubject, authSubject))
      .limit(1);

    if (!identity) return null;

    await transaction.execute(sql`SELECT set_config('app.current_user_id', ${identity.id}, true)`);

    const activeMemberships = await transaction
      .select({
        membershipId: memberships.id,
        tenantId: memberships.tenantId,
        roleCode: memberships.roleCode
      })
      .from(memberships)
      .where(eq(memberships.status, "active"));

    return {
      userId: identity.id,
      email: identity.email,
      displayName: identity.displayName,
      memberships: activeMemberships
    };
  });
}
