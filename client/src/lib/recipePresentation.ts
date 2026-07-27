import type { Recipe } from "@shared/recipe";

export type RecipeResultsFilter = "all" | "no-shopping";

const FALLBACK_FOOD_IMAGES = {
  chicken: "/manus-storage/mise-fallback-harissa-chicken_d6873920.jpg",
  salmon: "/manus-storage/mise-fallback-salmon-bowl_262e4a70.jpg",
  tofu: "/manus-storage/mise-fallback-tofu-noodles_c6aef288.jpg",
  frittata: "/manus-storage/mise-fallback-frittata_2515a97c.jpg",
} as const;

export function pollinationsFoodImageUrl(recipeName: string): string {
  const description = `${recipeName} food photography top down view matte ceramic bowl wooden surface warm natural window light soft shadows minimal styling editorial quality`;
  const prompt = encodeURIComponent(description).replace(/%20/g, "+");
  return `https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&nologo=true`;
}

export function fallbackFoodImageUrl(recipeName: string): string {
  const normalizedName = recipeName.toLowerCase();
  if (normalizedName.includes("salmon")) return FALLBACK_FOOD_IMAGES.salmon;
  if (normalizedName.includes("tofu") || normalizedName.includes("noodle")) return FALLBACK_FOOD_IMAGES.tofu;
  if (normalizedName.includes("frittata") || normalizedName.includes("broccoli")) return FALLBACK_FOOD_IMAGES.frittata;
  return FALLBACK_FOOD_IMAGES.chicken;
}

export function isFallbackImagePreview(search: string): boolean {
  return new URLSearchParams(search).get("imageFallback") === "1";
}

export function isUnavailableImagePreview(search: string): boolean {
  return new URLSearchParams(search).get("imageUnavailable") === "1";
}

export function recipeResultId(recipe: Pick<Recipe, "name">): string {
  return recipe.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "recipe";
}

export function visibleRecipes(recipes: Recipe[], filter: RecipeResultsFilter): Recipe[] {
  const filtered = filter === "no-shopping" ? recipes.filter((recipe) => recipe.missing_ingredients.length === 0) : recipes;
  return [...filtered].sort((left, right) => right.score - left.score);
}
