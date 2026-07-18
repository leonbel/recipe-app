import { describe, expect, it } from "vitest";
import { authCallbackUrl, authRouteWithNext, resolveAuthNextPath } from "./auth-routing";

describe("auth redirect routing", () => {
  it("falls back to capture when no internal destination is provided", () => {
    expect(resolveAuthNextPath(null)).toBe("/");
    expect(resolveAuthNextPath("https://untrusted.example")).toBe("/");
    expect(resolveAuthNextPath("//untrusted.example")).toBe("/");
  });

  it("prevents login loops and preserves valid in-app destinations", () => {
    expect(resolveAuthNextPath("/login")).toBe("/");
    expect(resolveAuthNextPath("/signup?next=%2Fhistory")).toBe("/");
    expect(resolveAuthNextPath("/history")).toBe("/history");
  });

  it("constructs safe query and Supabase OAuth callback URLs", () => {
    expect(authRouteWithNext("/login", "/history")).toBe("/login?next=%2Fhistory");
    expect(authCallbackUrl("https://mise.example", "/history")).toBe("https://mise.example/auth/callback?next=%2Fhistory");
  });
});
