import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/redirect";

describe("safeNext", () => {
  it("keeps same-site paths", () => expect(safeNext("/vakken/pharmacology")).toBe("/vakken/pharmacology"));
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "", null])("rejects %s", (v) => {
    expect(safeNext(v)).toBe("/dashboard");
  });
});
