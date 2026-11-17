import { isSharedDemoStorageKey } from "@/lib/demo-storage/config";
import {
  DemoStoragePayloadTooLargeError,
  readDemoValue,
  serverStorageEnabled,
  writeDemoValue
} from "@/lib/demo-storage/server";

export const runtime = "nodejs";

type StorageRouteContext = { params: Promise<{ key: string }> };

export async function GET(_request: Request, context: StorageRouteContext) {
  if (!serverStorageEnabled()) return storageDisabledResponse();
  const { key } = await context.params;
  if (!isSharedDemoStorageKey(key)) return Response.json({ error: "Unknown storage key" }, { status: 404 });

  const record = await readDemoValue(key);
  if (!record) return Response.json({ value: null, updatedAt: null });
  return Response.json(record, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request, context: StorageRouteContext) {
  if (!serverStorageEnabled()) return storageDisabledResponse();
  const { key } = await context.params;
  if (!isSharedDemoStorageKey(key)) return Response.json({ error: "Unknown storage key" }, { status: 404 });

  try {
    const body = (await request.json()) as { value?: unknown };
    if (!("value" in body)) return Response.json({ error: "Missing value" }, { status: 400 });
    return Response.json(await writeDemoValue(key, body.value));
  } catch (error) {
    if (error instanceof DemoStoragePayloadTooLargeError) {
      return Response.json({ error: error.message }, { status: 413 });
    }
    if (error instanceof SyntaxError) return Response.json({ error: "Invalid JSON" }, { status: 400 });
    console.error("Shared demo data could not be written", error);
    return Response.json({ error: "Storage write failed" }, { status: 500 });
  }
}

function storageDisabledResponse() {
  return Response.json({ error: "Shared demo storage is disabled" }, { status: 503 });
}
