import { describe, expect, it } from "vitest";
import { resolveSupabaseConfig } from "./supabase";

describe("resolveSupabaseConfig", () => {
  it("resolves the existing unprefixed deployment variables", () => {
    expect(
      resolveSupabaseConfig({
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toEqual({
      configured: true,
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });

  it("prefers Vite-prefixed variables when both conventions are present", () => {
    const result = resolveSupabaseConfig({
      SUPABASE_URL: "https://fallback.supabase.co",
      SUPABASE_ANON_KEY: "fallback-key",
      VITE_SUPABASE_URL: "https://preferred.supabase.co",
      VITE_SUPABASE_ANON_KEY: "preferred-key",
    });

    expect(result).toEqual({
      configured: true,
      url: "https://preferred.supabase.co",
      anonKey: "preferred-key",
    });
  });

  it("returns a safe missing state rather than constructing an invalid client", () => {
    expect(resolveSupabaseConfig({})).toEqual({
      configured: false,
      missing: ["url", "anonKey"],
    });
  });
});
