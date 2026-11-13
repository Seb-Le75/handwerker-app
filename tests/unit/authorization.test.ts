import { describe, expect, it } from "vitest";

import { hasPermission } from "../../src/auth/authorization";

describe("hasPermission", () => {
  it("accepts only an explicitly granted permission", () => {
    expect(hasPermission(["tenant.read", "members.invite"], "members.invite")).toBe(true);
    expect(hasPermission(["members.read"], "members.disable")).toBe(false);
  });
});
