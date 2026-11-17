"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, DatabaseBackup } from "lucide-react";

import { isSharedDemoStorageEnabled } from "@/lib/demo-storage/config";

type StorageState = "checking" | "connected" | "offline" | "local";

export function StorageStatus() {
  const [state, setState] = useState<StorageState>(isSharedDemoStorageEnabled() ? "checking" : "local");
  const [backupConfigured, setBackupConfigured] = useState(false);

  useEffect(() => {
    if (!isSharedDemoStorageEnabled()) return;
    let active = true;

    async function check() {
      try {
        const response = await fetch("/api/demo-storage/status", { cache: "no-store" });
        const status = (await response.json()) as { enabled?: boolean; backupConfigured?: boolean };
        if (!active) return;
        setState(response.ok && status.enabled ? "connected" : "offline");
        setBackupConfigured(Boolean(status.backupConfigured));
      } catch {
        if (active) setState("offline");
      }
    }

    void check();
    const interval = window.setInterval(() => void check(), 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (state === "local") {
    return <span className="text-xs text-muted-foreground">Lokale Testdaten auf diesem Gerät</span>;
  }

  if (state === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        {backupConfigured ? <DatabaseBackup className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
        Gemeinsame Daten · Mac mini{backupConfigured ? " + NAS-Sicherung" : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
      <CloudOff className="h-4 w-4" />
      {state === "checking" ? "Verbindung wird geprüft" : "Server nicht erreichbar · Gerätekopie aktiv"}
    </span>
  );
}
