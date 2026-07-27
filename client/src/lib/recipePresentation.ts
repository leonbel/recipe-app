import type { Recipe } from "@shared/recipe";

export type RecipeResultsFilter = "all" | "no-shopping";

export function pollinationsFoodImageUrl(recipeName: string): string {
  const description = `${recipeName} food photography top down view matte ceramic bowl wooden surface warm natural window light soft shadows minimal styling editorial quality`;
  const prompt = encodeURIComponent(description).replace(/%20/g, "+");
  return `https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&nologo=true`;
}

export function recipeResultId(recipe: Pick<Recipe, "name">): string {
  return recipe.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "recipe";
}

export function visibleRecipes(recipes: Recipe[], filter: RecipeResultsFilter): Recipe[] {
  const filtered = filter === "no-shopping" ? recipes.filter((recipe) => recipe.missing_ingredients.length === 0) : recipes;
  return [...filtered].sort((left, right) => right.score - left.score);
}
