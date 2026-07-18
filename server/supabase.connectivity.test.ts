import { describe, expect, it } from "vitest";

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.SUPABASE_ANON_KEY;

describe("Supabase project configuration", () => {
  it("authenticates a lightweight request to the Auth settings endpoint", async () => {
    expect(url, "SUPABASE_URL must be configured").toBeTruthy();
    expect(anonKey, "SUPABASE_ANON_KEY must be configured").toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: anonKey!,
      },
    });

    expect(response.status).toBe(200);

    const settings = (await response.json()) as { external?: Record<string, boolean> };
    expect(settings).toHaveProperty("external");
  }, 15_000);
});
