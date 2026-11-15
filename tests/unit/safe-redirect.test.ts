import { describe, expect, it } from "vitest";

import { safeInternalPath } from "@/lib/navigation/safe-redirect";

describe("safeInternalPath", () => {
  it("keeps local paths including their query", () => {
    expect(safeInternalPath("/invite/token?source=email")).toBe("/invite/token?source=email");
  });

  it.each(["https://evil.example", "//evil.example/path", "/\\evil.example", "javascript:alert(1)"])(
    "rejects unsafe destination %s",
    (destination) => expect(safeInternalPath(destination)).toBe("/admin")
  );
});
