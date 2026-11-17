// @vitest-environment node

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { readDemoValue, writeDemoValue } from "@/lib/demo-storage/server";

const originalDataDirectory = process.env.HANDWERKER_DATA_DIR;
const originalBackupDirectory = process.env.HANDWERKER_BACKUP_DIR;
let testDirectory: string | undefined;

afterEach(async () => {
  if (originalDataDirectory === undefined) delete process.env.HANDWERKER_DATA_DIR;
  else process.env.HANDWERKER_DATA_DIR = originalDataDirectory;
  if (originalBackupDirectory === undefined) delete process.env.HANDWERKER_BACKUP_DIR;
  else process.env.HANDWERKER_BACKUP_DIR = originalBackupDirectory;
  if (testDirectory) await rm(testDirectory, { recursive: true, force: true });
  testDirectory = undefined;
});

describe("shared demo storage", () => {
  it("writes active data atomically and creates NAS-style latest and daily backups", async () => {
    testDirectory = await mkdtemp(path.join(tmpdir(), "handwerker-demo-storage-"));
    process.env.HANDWERKER_DATA_DIR = path.join(testDirectory, "active");
    process.env.HANDWERKER_BACKUP_DIR = path.join(testDirectory, "backup");

    const record = await writeDemoValue("hsa-jobs", [{ id: "job-test" }]);

    await expect(readDemoValue("hsa-jobs")).resolves.toEqual(record);
    const latest = JSON.parse(
      await readFile(path.join(testDirectory, "backup", "latest", "hsa-jobs.json"), "utf8")
    ) as unknown;
    expect(latest).toEqual(record);
    await expect(
      readFile(path.join(testDirectory, "backup", record.updatedAt.slice(0, 10), "hsa-jobs.json"), "utf8")
    ).resolves.toBe(JSON.stringify(record));
  });
});
