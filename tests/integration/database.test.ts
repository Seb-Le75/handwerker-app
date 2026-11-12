import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const sql = databaseUrl ? postgres(databaseUrl, { max: 1 }) : undefined;

afterAll(async () => {
  await sql?.end();
});

describe.skipIf(!sql)("PostgreSQL baseline", () => {
  it("connects to the configured database", async () => {
    const [result] = await sql!`SELECT 1 AS healthy`;
    expect(result.healthy).toBe(1);
  });

  it("has applied the immutable phase-zero migration", async () => {
    const [result] = await sql!`
      SELECT checksum
      FROM public._schema_migrations
      WHERE name = '0000_phase0_baseline.sql'
    `;
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});
