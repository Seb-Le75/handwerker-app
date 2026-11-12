import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and export the value before migrating.");
}

const migrationsDirectory = path.join(import.meta.dirname, "migrations");
const sql = postgres(databaseUrl, { max: 1, onnotice: () => undefined });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS public._schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const migration = await readFile(path.join(migrationsDirectory, file), "utf8");
    const checksum = createHash("sha256").update(migration).digest("hex");
    const [applied] = await sql`
      SELECT checksum FROM public._schema_migrations WHERE name = ${file}
    `;

    if (applied?.checksum === checksum) {
      continue;
    }

    if (applied) {
      throw new Error(`Migration ${file} changed after it was applied.`);
    }

    await sql.begin(async (transaction) => {
      await transaction.unsafe(migration);
      await transaction`
        INSERT INTO public._schema_migrations (name, checksum)
        VALUES (${file}, ${checksum})
      `;
    });

    console.log(`Applied ${file}`);
  }
} finally {
  await sql.end();
}
