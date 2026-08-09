import { loadGeneratedRecipes } from "./generatedRecipes";
import { recipeResultId } from "./recipePresentation";
import { REVIEW_RECIPES } from "./reviewRecipes";
import type { Recipe } from "@shared/recipe";

const ACTIVE_RECIPE_SESSION_KEY = "mise.active-recipe.v1";

export function saveActiveRecipe(recipe: Recipe): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ACTIVE_RECIPE_SESSION_KEY, JSON.stringify(recipe));
}

export function loadActiveRecipe(): Recipe | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(ACTIVE_RECIPE_SESSION_KEY);
    return stored ? (JSON.parse(stored) as Recipe) : null;
  } catch {
    return null;
  }
}

export function resolveRecipeForRoute(recipeId: string, reviewMode: boolean): Recipe | undefined {
  const activeRecipe = loadActiveRecipe();
  if (activeRecipe && recipeResultId(activeRecipe) === recipeId) return activeRecipe;

  const recipes = reviewMode ? REVIEW_RECIPES : loadGeneratedRecipes()?.recipes ?? [];
  return recipes.find((recipe) => recipeResultId(recipe) === recipeId);
}
