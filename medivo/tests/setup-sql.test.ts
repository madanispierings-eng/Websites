import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("supabase/setup.sql", () => {
  it("matches the migrations and seed", () => {
    const committed = readFileSync("supabase/setup.sql", "utf8");
    execFileSync("scripts/build-setup-sql.sh");
    expect(readFileSync("supabase/setup.sql", "utf8")).toBe(committed);
  });
});
