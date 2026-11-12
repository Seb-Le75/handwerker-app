import { and, eq, sql } from "drizzle-orm";

import { createDatabase, type Database, type SqlClient } from "@/db/client";
import { memberships } from "@/db/schema";

export type TenantContext = Readonly<{
  tenantId: string;
  userId: string;
}>;

export type VerifiedTenantContext = TenantContext &
  Readonly<{
    membershipId: string;
    roleCode: string;
  }>;

export class InvalidTenantContextError extends Error {
  constructor() {
    super("The user has no active membership in the requested tenant.");
    this.name = "InvalidTenantContextError";
  }
}

export async function withTenantContext<T>(
  client: SqlClient,
  context: TenantContext,
  operation: (database: Database, verifiedContext: VerifiedTenantContext) => Promise<T>
): Promise<T> {
  const database = createDatabase(client);

  return database.transaction(async (transaction) => {
    await transaction.execute(sql.raw("SET LOCAL ROLE handwerker_app"));
    await transaction.execute(sql`SELECT set_config('app.current_tenant_id', ${context.tenantId}, true)`);
    await transaction.execute(sql`SELECT set_config('app.current_user_id', ${context.userId}, true)`);

    const [membership] = await transaction
      .select({ id: memberships.id, roleCode: memberships.roleCode })
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, context.tenantId),
          eq(memberships.userId, context.userId),
          eq(memberships.status, "active")
        )
      )
      .limit(1);

    if (!membership) {
      throw new InvalidTenantContextError();
    }

    return operation(transaction as unknown as Database, {
      ...context,
      membershipId: membership.id,
      roleCode: membership.roleCode
    });
  });
}
