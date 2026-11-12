import { describe, expect, it } from "vitest";

import { readClientEnvironment } from "@/lib/env/client";

describe("client environment", () => {
  it("uses a safe default application name", () => {
    expect(readClientEnvironment({}).NEXT_PUBLIC_APP_NAME).toBe("Handwerker Service App");
  });

  it("rejects an empty public application name", () => {
    expect(() => readClientEnvironment({ NEXT_PUBLIC_APP_NAME: "" })).toThrow();
  });
});
