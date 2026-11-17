import { demoBackupDirectory, serverStorageEnabled } from "@/lib/demo-storage/server";

export const runtime = "nodejs";

export function GET() {
  const enabled = serverStorageEnabled();
  return Response.json(
    {
      enabled,
      storage: enabled ? "Mac mini" : "Browser",
      backupConfigured: enabled && Boolean(demoBackupDirectory())
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
