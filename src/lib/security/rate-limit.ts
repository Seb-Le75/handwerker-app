import "server-only";

import { createHmac } from "node:crypto";

import { sql } from "drizzle-orm";

import { createDatabase, createSqlClient } from "@/db/client";

export type RateLimitScope = "login_email" | "password_reset_email" | "member_invite_actor";

export async function consumeRateLimit(input: {
  scope: RateLimitScope;
  identifier: string;
  limit: number;
  windowSeconds: number;
}) {
  const databaseUrl = process.env.DATABASE_URL;
  const secret = process.env.RATE_LIMIT_SECRET?.trim();
  if (!databaseUrl || !secret) {
    if (process.env.NODE_ENV === "production") throw new Error("Rate limiting is not configured.");
    return true;
  }

  const keyHash = createHmac("sha256", secret)
    .update(`${input.scope}:${input.identifier.trim().toLowerCase()}`)
    .digest("hex");
  const client = createSqlClient(databaseUrl);
  try {
    const database = createDatabase(client);
    const result = await database.transaction(async (transaction) => {
      await transaction.execute(sql.raw("SET LOCAL ROLE handwerker_app"));
      return transaction.execute(sql`
        SELECT app_private.consume_rate_limit(
          ${input.scope}, ${keyHash}, ${input.limit}, ${input.windowSeconds}
        ) AS allowed
      `);
    });
    return result[0]?.allowed === true;
  } finally {
    await client.end();
  }
}
