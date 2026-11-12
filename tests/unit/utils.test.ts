import { describe, expect, it } from "vitest";

import { cn, formatCustomerName, formatDateTime } from "@/lib/utils";

describe("existing utility behavior", () => {
  it("formats a customer name and trims missing parts", () => {
    expect(formatCustomerName("Marlene", "Schneider")).toBe("Marlene Schneider");
    expect(formatCustomerName("", "Schneider")).toBe("Schneider");
  });

  it("merges conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("formats a known timestamp for the German locale", () => {
    expect(formatDateTime("2026-05-23T09:00:00.000Z")).toMatch(/23\.05\.2026/);
  });
});
