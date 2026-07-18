import { describe, expect, it } from "vitest";
import { resolveAuthAccess } from "./access-control";

describe("route access control", () => {
  it("allows capture to render for a guest without waiting for Supabase", () => {
    expect(resolveAuthAccess({ configured: false, loading: true, authenticated: false, allowGuest: true })).toBe("content");
  });

  it("redirects unauthenticated guests from account-specific routes", () => {
    expect(resolveAuthAccess({ configured: true, loading: false, authenticated: false, allowGuest: false })).toBe("redirect");
  });

  it("preserves configuration, loading, and authenticated protected-route states", () => {
    expect(resolveAuthAccess({ configured: false, loading: false, authenticated: false, allowGuest: false })).toBe("configuration");
    expect(resolveAuthAccess({ configured: true, loading: true, authenticated: false, allowGuest: false })).toBe("loading");
    expect(resolveAuthAccess({ configured: true, loading: false, authenticated: true, allowGuest: false })).toBe("content");
  });
});
