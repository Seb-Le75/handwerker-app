import { execFile } from "node:child_process";
import { promisify } from "node:util";

import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;
const sql = databaseUrl ? postgres(databaseUrl, { max: 1, onnotice: () => undefined }) : undefined;

afterAll(async () => {
  await sql?.end();
});

describe.skipIf(!sql)("local demo seed", () => {
  it("creates two isolated tenants and a user with two memberships", async () => {
    await execFileAsync(process.execPath, ["db/seed.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, APP_ENV: "development", NODE_ENV: "test", DATABASE_URL: databaseUrl }
    });
    await execFileAsync(process.execPath, ["db/seed.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, APP_ENV: "development", NODE_ENV: "test", DATABASE_URL: databaseUrl }
    });

    const [tenantCount] = await sql!`SELECT count(*)::integer AS value FROM tenants WHERE slug LIKE 'demo-%'`;
    const [membershipCount] = await sql!`
      SELECT count(*)::integer AS value
      FROM memberships
      WHERE user_id = '019a7d10-0000-7000-8000-000000000101'
    `;
    expect(tenantCount.value).toBe(2);
    expect(membershipCount.value).toBe(2);
  });

  it("refuses to run in production", async () => {
    await expect(
      execFileAsync(process.execPath, ["db/seed.mjs"], {
        cwd: process.cwd(),
        env: { ...process.env, APP_ENV: "production", NODE_ENV: "production", DATABASE_URL: databaseUrl }
      })
    ).rejects.toMatchObject({ code: 1 });
  });
});
