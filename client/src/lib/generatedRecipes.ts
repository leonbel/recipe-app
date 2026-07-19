import { RecipeGenerationResponseSchema, type RecipeGenerationResponse } from "@shared/recipe";

const GENERATED_RECIPES_SESSION_KEY = "mise.generated-recipes.v1";

export function saveGeneratedRecipes(recipes: RecipeGenerationResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GENERATED_RECIPES_SESSION_KEY, JSON.stringify(recipes));
}

export function loadGeneratedRecipes(): RecipeGenerationResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(GENERATED_RECIPES_SESSION_KEY);
    return stored ? RecipeGenerationResponseSchema.parse(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}
