import { describe, expect, it } from "vitest";
import { formatIngredientQuantity, formatTimer, scaleIngredients, scaledIngredientQuantity } from "./recipeExperience";
import { REVIEW_RECIPES } from "./reviewRecipes";

describe("recipe experience helpers", () => {
  it("scales an ingredient proportionally from the recipe base servings", () => {
    expect(scaledIngredientQuantity(400, 2, 3)).toBe(600);
    expect(scaledIngredientQuantity(1.5, 2, 4)).toBe(3);
  });

  it("formats useful kitchen fractions", () => {
    expect(formatIngredientQuantity(0.5)).toBe("½");
    expect(formatIngredientQuantity(1.25)).toBe("1¼");
    expect(formatIngredientQuantity(2)).toBe("2");
  });

  it("returns scaled recipe ingredients without mutating the source recipe", () => {
    const recipe = REVIEW_RECIPES[0];
    const scaled = scaleIngredients(recipe, 4);
    expect(scaled[0]).toMatchObject({ name: "Chicken thighs", scaledQty: 800, displayQty: "800" });
    expect(recipe.ingredients[0].qty).toBe(400);
  });

  it("formats timer seconds as a stable minutes-and-seconds string", () => {
    expect(formatTimer(65)).toBe("01:05");
    expect(formatTimer(-10)).toBe("00:00");
  });
});
