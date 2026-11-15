"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let storedValue: T | undefined;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        storedValue = JSON.parse(stored) as T;
      }
    } catch {
      // Keep the safe seed value if older or incomplete local data cannot be read.
    }
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (storedValue !== undefined) setValue(storedValue);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (hydrated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Safari private mode and large photo payloads may reject local writes.
        // The current screen remains usable even when persistence is unavailable.
      }
    }
  }, [hydrated, key, value]);

  return [value, setValue, hydrated] as const;
}
