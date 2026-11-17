import { describe, expect, it } from "vitest";

import { isSharedDemoStorageKey } from "@/lib/demo-storage/config";

describe("shared demo storage keys", () => {
  it("allows business data that must be shared", () => {
    expect(isSharedDemoStorageKey("hsa-jobs")).toBe(true);
    expect(isSharedDemoStorageKey("hsa-customers")).toBe(true);
    expect(isSharedDemoStorageKey("hsa-payment-settings")).toBe(true);
  });

  it("keeps device preferences and unknown paths out of server storage", () => {
    expect(isSharedDemoStorageKey("hsa-work-area")).toBe(false);
    expect(isSharedDemoStorageKey("../secrets")).toBe(false);
  });
});
