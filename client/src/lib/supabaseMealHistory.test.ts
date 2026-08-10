import { describe, expect, it } from "vitest";
import { SUPABASE_MEAL_HISTORY_KEY, accountMealHistoryFromMetadata } from "./supabaseMealHistory";
import { REVIEW_RECIPES } from "./reviewRecipes";

describe("Supabase account meal history metadata", () => {
  it("reads valid saved meals, sorts them newest first, and ignores malformed metadata", () => {
    const records = accountMealHistoryFromMetadata({
      [SUPABASE_MEAL_HISTORY_KEY]: [
        { id: "older", recipe: REVIEW_RECIPES[0], servings: 2, rating: 4, notes: "", cookedAt: 10 },
        { id: "newer", recipe: REVIEW_RECIPES[1], servings: 2, rating: 5, notes: "Great", cookedAt: 20 },
        { invalid: true },
      ],
    });
    expect(records.map((record) => record.id)).toEqual(["newer", "older"]);
  });
});
