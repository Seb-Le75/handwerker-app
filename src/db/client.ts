import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { schema } from "@/db/schema";

export type SqlClient = ReturnType<typeof postgres>;

export function createSqlClient(databaseUrl: string): SqlClient {
  return postgres(databaseUrl, {
    max: 10,
    onnotice: () => undefined
  });
}

export function createDatabase(client: SqlClient) {
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
