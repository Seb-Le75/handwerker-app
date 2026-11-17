"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { isSharedDemoStorageEnabled, isSharedDemoStorageKey } from "@/lib/demo-storage/config";

type RemoteRecord<T> = { value: T | null; updatedAt: string | null };

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValueState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const valueRef = useRef(value);
  const remoteUpdatedAtRef = useRef<string | null>(null);
  const shared = isSharedDemoStorageEnabled() && isSharedDemoStorageKey(key);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const storeLocally = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Safari private mode and large photo payloads may reject local writes.
      }
    },
    [key]
  );

  const storeRemotely = useCallback(
    async (next: T) => {
      if (!shared) return;
      try {
        const response = await fetch(`/api/demo-storage/${encodeURIComponent(key)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: next })
        });
        if (!response.ok) return;
        const record = (await response.json()) as RemoteRecord<T>;
        remoteUpdatedAtRef.current = record.updatedAt;
      } catch {
        // Keep working from the device cache. A later update or reload retries the server.
      }
    },
    [key, shared]
  );

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (nextValue) => {
      const next = typeof nextValue === "function" ? (nextValue as (current: T) => T)(valueRef.current) : nextValue;
      valueRef.current = next;
      setValueState(next);
      storeLocally(next);
      void storeRemotely(next);
    },
    [storeLocally, storeRemotely]
  );

  useEffect(() => {
    let active = true;

    async function initialize() {
      let localValue = initialValue;
      try {
        const stored = window.localStorage.getItem(key);
        if (stored) localValue = JSON.parse(stored) as T;
      } catch {
        // Keep the safe seed value if older or incomplete local data cannot be read.
      }

      let resolvedValue = localValue;
      if (shared) {
        try {
          const response = await fetch(`/api/demo-storage/${encodeURIComponent(key)}`, { cache: "no-store" });
          if (response.ok) {
            const record = (await response.json()) as RemoteRecord<T>;
            remoteUpdatedAtRef.current = record.updatedAt;
            if (record.value !== null) {
              resolvedValue = record.value;
            } else {
              void storeRemotely(localValue);
            }
          }
        } catch {
          // The cached browser value keeps the field workflow available during a connection interruption.
        }
      }

      if (!active) return;
      valueRef.current = resolvedValue;
      setValueState(resolvedValue);
      storeLocally(resolvedValue);
      setHydrated(true);
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [initialValue, key, shared, storeLocally, storeRemotely]);

  useEffect(() => {
    if (!shared || !hydrated) return;

    let active = true;
    async function refresh() {
      try {
        const response = await fetch(`/api/demo-storage/${encodeURIComponent(key)}`, { cache: "no-store" });
        if (!response.ok) return;
        const record = (await response.json()) as RemoteRecord<T>;
        if (!active || record.value === null || record.updatedAt === remoteUpdatedAtRef.current) return;
        remoteUpdatedAtRef.current = record.updatedAt;
        valueRef.current = record.value;
        setValueState(record.value);
        storeLocally(record.value);
      } catch {
        // The next poll retries automatically.
      }
    }

    const interval = window.setInterval(() => void refresh(), 5_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [hydrated, key, shared, storeLocally]);

  return [value, setValue, hydrated] as const;
}
