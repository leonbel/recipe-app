import { describe, expect, it } from "vitest";
import { MealLogInputSchema } from "./mealLog";
import { REVIEW_RECIPES } from "../client/src/lib/reviewRecipes";

describe("meal-log contract", () => {
  it("accepts a bounded post-cook rating, notes, servings, and recipe snapshot", () => {
    const parsed = MealLogInputSchema.parse({
      recipe: REVIEW_RECIPES[0],
      servings: 3,
      rating: 4,
      notes: "Will add extra lemon next time.",
      cookedAt: 1_700_000_000_000,
    });
    expect(parsed.servings).toBe(3);
    expect(parsed.rating).toBe(4);
  });

  it("rejects invalid ratings and unsafe servings before persistence", () => {
    expect(() => MealLogInputSchema.parse({ recipe: REVIEW_RECIPES[0], servings: 0, rating: 5 })).toThrow();
    expect(() => MealLogInputSchema.parse({ recipe: REVIEW_RECIPES[0], servings: 2, rating: 6 })).toThrow();
  });
});
