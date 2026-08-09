import type { Recipe } from "@shared/recipe";

type RecipeIngredient = Recipe["ingredients"][number];

const FRACTIONS: Array<[number, string]> = [
  [0.75, "¾"],
  [0.5, "½"],
  [0.25, "¼"],
];

export function scaledIngredientQuantity(quantity: number, baseServings: number, servings: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(baseServings) || !Number.isFinite(servings) || baseServings <= 0) return 0;
  return Math.round((quantity * servings * 100) / baseServings) / 100;
}

export function formatIngredientQuantity(quantity: number): string {
  if (!Number.isFinite(quantity) || quantity <= 0) return "";
  const whole = Math.floor(quantity);
  const fraction = quantity - whole;
  const matchedFraction = FRACTIONS.find(([target]) => Math.abs(fraction - target) < 0.04);

  if (matchedFraction) return `${whole || ""}${matchedFraction[1]}`;
  if (Math.abs(fraction) < 0.04) return String(whole);
  return quantity.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function scaleIngredients(recipe: Recipe, servings: number): Array<RecipeIngredient & { scaledQty: number; displayQty: string }> {
  return recipe.ingredients.map((ingredient) => {
    const scaledQty = scaledIngredientQuantity(ingredient.qty, recipe.base_servings, servings);
    return { ...ingredient, scaledQty, displayQty: formatIngredientQuantity(scaledQty) };
  });
}

export function formatTimer(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
