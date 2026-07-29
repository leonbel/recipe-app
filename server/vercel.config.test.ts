import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Rewrite = { source: string; destination: string };

describe("Vercel SPA routing configuration", () => {
  it("rewrites each client-side deep link to the application entry point without catching API routes", () => {
    const configPath = path.resolve(process.cwd(), "vercel.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as { rewrites?: Rewrite[] };
    const rewrites = config.rewrites ?? [];

    expect(rewrites).toEqual(
      expect.arrayContaining([
        { source: "/login", destination: "/index.html" },
        { source: "/signup", destination: "/index.html" },
        { source: "/auth/callback", destination: "/index.html" },
        { source: "/recipes/:path*", destination: "/index.html" },
        { source: "/history", destination: "/index.html" },
      ]),
    );
    expect(rewrites.some((rewrite) => rewrite.source.startsWith("/api"))).toBe(false);
  });
});
