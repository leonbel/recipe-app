import { describe, expect, it } from "vitest";
import { pollinationsFoodImageUrl, recipeResultId, visibleRecipes } from "./recipePresentation";
import { recipeDetailPath } from "@/routes";

describe("recipe results presentation", () => {
  it("builds the brief-aligned Pollinations food photography URL", () => {
    expect(pollinationsFoodImageUrl("Moroccan Chicken Tagine")).toBe(
      "https://image.pollinations.ai/prompt/Moroccan+Chicken+Tagine+food+photography+top+down+view+matte+ceramic+bowl+wooden+surface+warm+natural+window+light+soft+shadows+minimal+styling+editorial+quality?width=800&height=600&nologo=true",
    );
  });

  it("sorts recipes by score and can retain only no-shopping choices", () => {
    const recipes = [
      { name: "Later", score: 70, missing_ingredients: ["Lemon"] },
      { name: "Ready", score: 90, missing_ingredients: [] },
    ] as never[];
    expect(visibleRecipes(recipes, "all").map((recipe) => recipe.name)).toEqual(["Ready", "Later"]);
    expect(visibleRecipes(recipes, "no-shopping").map((recipe) => recipe.name)).toEqual(["Ready"]);
    expect(recipeResultId({ name: "Spanish Chicken & Chickpea" })).toBe("spanish-chicken-chickpea");
    expect(recipeDetailPath(recipeResultId({ name: "Spanish Chicken & Chickpea" }))).toBe("/recipes/spanish-chicken-chickpea");
  });
});
