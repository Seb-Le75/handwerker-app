import { describe, expect, it } from "vitest";

describe("integration test harness", () => {
  it("runs independently from the browser test suite", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
