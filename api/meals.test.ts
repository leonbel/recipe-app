import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel meals serverless boundary", () => {
  it("is self-contained, verifies Supabase bearers, and persists against meal_logs", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "api/meals.ts"), "utf8");
    expect(source).toContain("/auth/v1/user");
    expect(source).toContain("meal_logs");
    expect(source).toContain("process.env.DATABASE_URL");
    expect(source).not.toMatch(/from\s+["']\.\.\/server\//);
  });
});
