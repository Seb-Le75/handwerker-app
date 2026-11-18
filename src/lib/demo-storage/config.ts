export const sharedDemoStorageKeys = [
  "hsa-customers",
  "hsa-jobs",
  "hsa-materials",
  "hsa-tools",
  "hsa-emergency-surcharges",
  "hsa-maintenance-checks",
  "hsa-payment-settings",
  "hsa-company-settings",
  "hsa-documents"
] as const;

export type SharedDemoStorageKey = (typeof sharedDemoStorageKeys)[number];

export function isSharedDemoStorageKey(value: string): value is SharedDemoStorageKey {
  return (sharedDemoStorageKeys as readonly string[]).includes(value);
}

export function isSharedDemoStorageEnabled() {
  return process.env.NEXT_PUBLIC_SHARED_DEMO_STORAGE === "true";
}
