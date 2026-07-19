import { describe, expect, it } from "vitest";
import { shouldUseVercelRecipeEndpoint } from "./vercelRecipes";

describe("Vercel recipe endpoint selection", () => {
  it("uses the serverless endpoint for Vercel builds and Vercel preview hostnames", () => {
    expect(shouldUseVercelRecipeEndpoint("vercel", "example.com")).toBe(true);
    expect(shouldUseVercelRecipeEndpoint("", "recipe-app.vercel.app")).toBe(true);
  });

  it("preserves the local tRPC flow outside Vercel", () => {
    expect(shouldUseVercelRecipeEndpoint("", "localhost")).toBe(false);
  });
});
