import { describe, expect, it } from "vitest";

import { addCalendarDays, startOfWeek, weekDateKeys } from "@/lib/planning";

describe("weekly planning", () => {
  it("starts on Monday and contains seven consecutive local dates", () => {
    expect(startOfWeek("2026-11-20")).toBe("2026-11-16");
    expect(weekDateKeys("2026-11-16")).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22"
    ]);
  });

  it("moves between weeks without changing the date format", () => {
    expect(addCalendarDays("2026-11-16", 7)).toBe("2026-11-23");
    expect(addCalendarDays("2026-11-16", -7)).toBe("2026-11-09");
  });
});
