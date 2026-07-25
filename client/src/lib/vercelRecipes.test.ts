import { afterEach, describe, expect, it, vi } from "vitest";
import { createFallbackRecipeResponse } from "../../../api/mockRecipes";
import { generateRecipesOnVercel, shouldUseVercelRecipeEndpoint } from "./vercelRecipes";

describe("Vercel recipe endpoint selection", () => {
  it("uses the serverless endpoint for Vercel builds and Vercel preview hostnames", () => {
    expect(shouldUseVercelRecipeEndpoint("vercel", "example.com")).toBe(true);
    expect(shouldUseVercelRecipeEndpoint("", "recipe-app.vercel.app")).toBe(true);
  });

  it("preserves the local tRPC flow outside Vercel", () => {
    expect(shouldUseVercelRecipeEndpoint("", "localhost")).toBe(false);
  });

  it("accepts a successful schema-valid fallback response from the Vercel endpoint", async () => {
    const fallback = createFallbackRecipeResponse();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await generateRecipesOnVercel({
      ingredients: ["Chicken breast", "Chickpeas"],
      healthGoals: ["High protein"],
      timeAvailable: "30 min",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/recipes", expect.objectContaining({ method: "POST" }));
    expect(response.recipes.map((recipe) => recipe.name)).toEqual([
      "Moroccan Chicken Tagine",
      "Spanish Chicken and Chickpea",
      "Tuscan Braised Chicken",
      "Indian Butter Chicken",
    ]);
  });
});

afterEach(() => vi.unstubAllGlobals());
