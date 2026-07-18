export type HealthGoalId = "balanced" | "high-protein" | "plant-forward" | "low-carb";

export type TimeFilter = 15 | 30 | 45 | 60;

export type CapturePreferences = {
  ingredients: string[];
  healthGoals: HealthGoalId[];
  maxMinutes: TimeFilter;
};

export const INGREDIENT_CATALOG = [
  "Avocado",
  "Basil",
  "Bell pepper",
  "Broccoli",
  "Brown rice",
  "Carrot",
  "Cheddar",
  "Chicken breast",
  "Chickpeas",
  "Coconut milk",
  "Cucumber",
  "Eggs",
  "Feta",
  "Garlic",
  "Greek yogurt",
  "Ground turkey",
  "Kale",
  "Lemon",
  "Lentils",
  "Mushrooms",
  "Onion",
  "Pasta",
  "Potatoes",
  "Quinoa",
  "Salmon",
  "Shrimp",
  "Spinach",
  "Sweet potato",
  "Tomatoes",
  "Tofu",
  "Tortillas",
  "Tuna",
  "Zucchini",
] as const;

export const QUICK_ADD_INGREDIENTS = ["Eggs", "Spinach", "Chicken breast", "Chickpeas", "Tomatoes", "Rice"] as const;

export const HEALTH_GOALS: ReadonlyArray<{ id: HealthGoalId; label: string; description: string }> = [
  { id: "balanced", label: "Balanced", description: "Well-rounded everyday meals" },
  { id: "high-protein", label: "High protein", description: "Protein-forward choices" },
  { id: "plant-forward", label: "Plant-forward", description: "Veg-focused and flexible" },
  { id: "low-carb", label: "Lower carb", description: "Lighter on starches" },
];

export const TIME_FILTERS: ReadonlyArray<{ value: TimeFilter; label: string; detail: string }> = [
  { value: 15, label: "15 min", detail: "Quick" },
  { value: 30, label: "30 min", detail: "Easy" },
  { value: 45, label: "45 min", detail: "Relaxed" },
  { value: 60, label: "60+ min", detail: "Any pace" },
];

const CAPTURE_SESSION_KEY = "mise.capture-preferences.v1";

export function createDefaultCapturePreferences(): CapturePreferences {
  return { ingredients: [], healthGoals: ["balanced"], maxMinutes: 30 };
}

function canonicalIngredient(value: string): string {
  const trimmed = value.trim();
  const matched = INGREDIENT_CATALOG.find((ingredient) => ingredient.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  return matched ?? trimmed;
}

export function addIngredient(ingredients: string[], value: string): string[] {
  const canonical = canonicalIngredient(value);
  if (!canonical || ingredients.some((ingredient) => ingredient.toLocaleLowerCase() === canonical.toLocaleLowerCase())) {
    return ingredients;
  }
  return [...ingredients, canonical];
}

export function removeIngredient(ingredients: string[], value: string): string[] {
  return ingredients.filter((ingredient) => ingredient.toLocaleLowerCase() !== value.toLocaleLowerCase());
}

export function findIngredientSuggestions(query: string, selected: string[], limit = 6): string[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];
  const selectedNames = new Set(selected.map((ingredient) => ingredient.toLocaleLowerCase()));
  return INGREDIENT_CATALOG.filter((ingredient) => ingredient.toLocaleLowerCase().includes(normalizedQuery) && !selectedNames.has(ingredient.toLocaleLowerCase())).slice(0, limit);
}

export function toggleHealthGoal(goals: HealthGoalId[], goal: HealthGoalId): HealthGoalId[] {
  if (goals.includes(goal)) {
    return goals.length === 1 ? goals : goals.filter((currentGoal) => currentGoal !== goal);
  }
  return [...goals, goal];
}

export function selectTimeFilter(preferences: CapturePreferences, maxMinutes: number): CapturePreferences {
  const isSupported = TIME_FILTERS.some((option) => option.value === maxMinutes);
  return isSupported ? { ...preferences, maxMinutes: maxMinutes as TimeFilter } : preferences;
}

export function hasCaptureIngredients(preferences: CapturePreferences): boolean {
  return preferences.ingredients.length > 0;
}

export function loadCapturePreferences(): CapturePreferences {
  if (typeof window === "undefined") return createDefaultCapturePreferences();
  try {
    const stored = window.sessionStorage.getItem(CAPTURE_SESSION_KEY);
    if (!stored) return createDefaultCapturePreferences();
    const parsed = JSON.parse(stored) as Partial<CapturePreferences>;
    const validGoals = Array.isArray(parsed.healthGoals)
      ? parsed.healthGoals.filter((goal): goal is HealthGoalId => HEALTH_GOALS.some((option) => option.id === goal))
      : [];
    const validMinutes = TIME_FILTERS.some((option) => option.value === parsed.maxMinutes) ? parsed.maxMinutes as TimeFilter : 30;
    const validIngredients = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.filter((ingredient): ingredient is string => typeof ingredient === "string" && ingredient.trim().length > 0)
      : [];
    return {
      ingredients: validIngredients,
      healthGoals: validGoals.length > 0 ? validGoals : ["balanced"],
      maxMinutes: validMinutes,
    };
  } catch {
    return createDefaultCapturePreferences();
  }
}

export function saveCapturePreferences(preferences: CapturePreferences): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CAPTURE_SESSION_KEY, JSON.stringify(preferences));
}
