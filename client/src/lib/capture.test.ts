import { describe, expect, it } from "vitest";
import {
  addIngredient,
  createDefaultCapturePreferences,
  findIngredientSuggestions,
  hasCaptureIngredients,
  removeIngredient,
  selectTimeFilter,
  toggleHealthGoal,
} from "./capture";

describe("capture ingredient helpers", () => {
  it("adds canonical ingredients once and removes them case-insensitively", () => {
    const selected = addIngredient([], "spinach");
    expect(selected).toEqual(["Spinach"]);
    expect(addIngredient(selected, "SPINACH")).toEqual(["Spinach"]);
    expect(removeIngredient(selected, "spinach")).toEqual([]);
  });

  it("offers relevant unselected autocomplete suggestions", () => {
    const suggestions = findIngredientSuggestions("chi", ["Chickpeas"]);
    expect(suggestions).toContain("Chicken breast");
    expect(suggestions).not.toContain("Chickpeas");
    expect(findIngredientSuggestions("", [])).toEqual([]);
  });
});

describe("capture preference helpers", () => {
  it("preserves at least one health goal", () => {
    expect(toggleHealthGoal(["High protein"], "High protein")).toEqual(["High protein"]);
    expect(toggleHealthGoal(["High protein"], "Gut-friendly")).toEqual(["High protein", "Gut-friendly"]);
    expect(toggleHealthGoal(["High protein", "Gut-friendly"], "High protein")).toEqual(["Gut-friendly"]);
  });

  it("requires one ingredient before a recipe search can begin", () => {
    const preferences = createDefaultCapturePreferences();
    expect(hasCaptureIngredients(preferences)).toBe(false);
    expect(hasCaptureIngredients({ ...preferences, ingredients: ["Eggs"] })).toBe(true);
  });

  it("accepts supported cooking-time filters and ignores unsupported values", () => {
    const preferences = createDefaultCapturePreferences();
    expect(selectTimeFilter(preferences, "30 min").timeAvailable).toBe("30 min");
    expect(selectTimeFilter(preferences, "15 min")).toEqual(preferences);
  });
});
