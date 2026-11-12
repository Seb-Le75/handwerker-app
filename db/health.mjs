import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const sql = postgres(databaseUrl, { max: 1 });

try {
  const [result] = await sql`SELECT current_database() AS database, 1 AS healthy`;
  console.log(`PostgreSQL healthy: ${result.database}`);
} finally {
  await sql.end();
}
