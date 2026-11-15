import { describe, expect, it } from "vitest";

import { calculateDiscountedTotal, calculateJobTotal, paypalMeUrl } from "@/lib/costs";
import { normalizeMaterialUnit } from "@/lib/materials";
import type { JobDraft } from "@/types";

describe("field workflow costs", () => {
  it("includes configured maintenance, travel, material and tool costs", () => {
    const draft = {
      travelCostCategory: "1",
      maintenanceChecks: [{ id: "maintenance", designation: "Wartung", flatRate: 50, travelFlatRate: 10 }],
      materials: [
        {
          id: "line",
          quantity: 3.15,
          unit: "m",
          materialId: "copper",
          materialName: "Kupferrohr",
          unitPrice: 8
        }
      ],
      tools: [{ id: "tool", quantity: 1, toolId: "press", toolName: "Presse", costRate: 20 }]
    } as JobDraft;

    expect(calculateJobTotal(draft)).toBe(120.2);
    expect(calculateDiscountedTotal(120.2, 5)).toBe(114.19);
  });

  it("builds safe PayPal.Me offers and migrates legacy units", () => {
    expect(paypalMeUrl("mein-betrieb", 114.19)).toBe("https://paypal.me/mein-betrieb/114.19EUR");
    expect(normalizeMaterialUnit("Länge")).toBe("m");
    expect(normalizeMaterialUnit("Menge")).toBe("l");
  });
});
