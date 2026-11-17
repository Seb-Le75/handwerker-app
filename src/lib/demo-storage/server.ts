import "server-only";

import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { SharedDemoStorageKey } from "@/lib/demo-storage/config";

const maximumPayloadBytes = 25 * 1024 * 1024;

export type StoredDemoValue = {
  value: unknown;
  updatedAt: string;
};

export function serverStorageEnabled() {
  return process.env.SHARED_DEMO_STORAGE === "true";
}

export function demoDataDirectory() {
  return path.resolve(process.env.HANDWERKER_DATA_DIR ?? path.join(process.cwd(), ".data", "handwerker"));
}

export function demoBackupDirectory() {
  const configured = process.env.HANDWERKER_BACKUP_DIR?.trim();
  return configured ? path.resolve(configured) : undefined;
}

function dataFile(key: SharedDemoStorageKey) {
  return path.join(demoDataDirectory(), `${key}.json`);
}

export async function readDemoValue(key: SharedDemoStorageKey): Promise<StoredDemoValue | undefined> {
  try {
    const source = await readFile(dataFile(key), "utf8");
    return JSON.parse(source) as StoredDemoValue;
  } catch (error) {
    if (isMissingFile(error)) return undefined;
    throw error;
  }
}

export async function writeDemoValue(key: SharedDemoStorageKey, value: unknown): Promise<StoredDemoValue> {
  const record: StoredDemoValue = { value, updatedAt: new Date().toISOString() };
  const serialized = JSON.stringify(record);
  if (Buffer.byteLength(serialized, "utf8") > maximumPayloadBytes) {
    throw new DemoStoragePayloadTooLargeError();
  }

  const directory = demoDataDirectory();
  await mkdir(directory, { recursive: true });
  const target = dataFile(key);
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, serialized, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
  await backupDemoValue(key, target, record.updatedAt);
  return record;
}

async function backupDemoValue(key: SharedDemoStorageKey, source: string, updatedAt: string) {
  const backupRoot = demoBackupDirectory();
  if (!backupRoot) return;

  try {
    const date = updatedAt.slice(0, 10);
    const dailyDirectory = path.join(backupRoot, date);
    await mkdir(dailyDirectory, { recursive: true });
    await copyFile(source, path.join(dailyDirectory, `${key}.json`));
    await mkdir(path.join(backupRoot, "latest"), { recursive: true });
    await copyFile(source, path.join(backupRoot, "latest", `${key}.json`));
  } catch (error) {
    // The active data remains safe on the Mac mini even if the NAS is asleep or disconnected.
    console.warn("NAS backup could not be written", error);
  }
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export class DemoStoragePayloadTooLargeError extends Error {
  constructor() {
    super("The shared demo payload exceeds 25 MB.");
  }
}
