import { describe, expect, it } from "vitest";
import { fallbackFoodImageUrl, isFallbackImagePreview, isImageErrorChainPreview, isPublicDesignReviewPreview, isUnavailableImagePreview, pollinationsFoodImageUrl, recipeResultId, visibleRecipes } from "./recipePresentation";
import { recipeDetailPath } from "@/routes";

describe("recipe results presentation", () => {
  it("builds the brief-aligned Pollinations food photography URL", () => {
    expect(pollinationsFoodImageUrl("Moroccan Chicken Tagine")).toBe(
      "https://image.pollinations.ai/prompt/Moroccan+Chicken+Tagine+food+photography+top+down+view+matte+ceramic+bowl+wooden+surface+warm+natural+window+light+soft+shadows+minimal+styling+editorial+quality?width=800&height=600&nologo=true",
    );
    expect(fallbackFoodImageUrl("Green Herb Salmon Bowl")).toBe("/manus-storage/mise-fallback-salmon-bowl_262e4a70.jpg");
    expect(fallbackFoodImageUrl("Crispy Tofu Sesame Noodles")).toBe("/manus-storage/mise-fallback-tofu-noodles_c6aef288.jpg");
    expect(fallbackFoodImageUrl("Charred Broccoli Frittata")).toBe("/manus-storage/mise-fallback-frittata_2515a97c.jpg");
    expect(fallbackFoodImageUrl("Moroccan Chicken Tagine")).toBe("/manus-storage/mise-fallback-harissa-chicken_d6873920.jpg");
    expect(isFallbackImagePreview("?preview=recipes&imageFallback=1")).toBe(true);
    expect(isFallbackImagePreview("?preview=recipes")).toBe(false);
    expect(isUnavailableImagePreview("?preview=recipes&imageUnavailable=1")).toBe(true);
    expect(isUnavailableImagePreview("?preview=recipes")).toBe(false);
    expect(isImageErrorChainPreview("?preview=recipes&imageErrorChain=1")).toBe(true);
    expect(isImageErrorChainPreview("?preview=recipes")).toBe(false);
    expect(isPublicDesignReviewPreview("?review=design")).toBe(true);
    expect(isPublicDesignReviewPreview("?review=other")).toBe(false);
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
