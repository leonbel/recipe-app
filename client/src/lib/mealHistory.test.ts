import { describe, expect, it } from "vitest";
import { appendMealRecord, filterMealHistory, type MealLogRecord } from "./mealHistory";
import { REVIEW_RECIPES } from "./reviewRecipes";

const meals: MealLogRecord[] = [
  { id: "1", recipe: REVIEW_RECIPES[0], servings: 2, rating: 5, notes: "Great weeknight dinner", cookedAt: 100 },
  { id: "2", recipe: REVIEW_RECIPES[1], servings: 3, rating: 4, notes: "Added extra herbs", cookedAt: 90 },
  { id: "3", recipe: REVIEW_RECIPES[2], servings: 2, rating: null, notes: "", cookedAt: 80 },
];

describe("meal history filtering", () => {
  it("searches recipe metadata and personal cooking notes", () => {
    expect(filterMealHistory(meals, "herbs", "all").map((meal) => meal.id)).toEqual(["2"]);
    expect(filterMealHistory(meals, "chicken", "all").map((meal) => meal.id)).toEqual(["1"]);
  });

  it("filters meal records by ratings without fabricating a rating", () => {
    expect(filterMealHistory(meals, "", "five").map((meal) => meal.id)).toEqual(["1"]);
    expect(filterMealHistory(meals, "", "four-plus").map((meal) => meal.id)).toEqual(["1", "2"]);
    expect(filterMealHistory(meals, "", "unrated").map((meal) => meal.id)).toEqual(["3"]);
  });

  it("prepends a new completed cook without mutating the existing history", () => {
    const updated = appendMealRecord(meals, { recipe: REVIEW_RECIPES[3], servings: 2, rating: null, notes: "", cookedAt: 110 });
    expect(updated).toHaveLength(4);
    expect(updated[0]).toMatchObject({ recipe: REVIEW_RECIPES[3], cookedAt: 110 });
    expect(meals).toHaveLength(3);
  });
});
