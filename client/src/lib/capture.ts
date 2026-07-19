import { HEALTH_TAGS, TIME_AVAILABLE_OPTIONS, type HealthTag, type TimeAvailable } from "@shared/recipe";

export type HealthGoalId = HealthTag;
export type TimeFilter = TimeAvailable;

export type CapturePreferences = {
  ingredients: string[];
  healthGoals: HealthGoalId[];
  timeAvailable: TimeFilter;
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
  { id: "High protein", label: "High protein", description: "Protein-forward choices" },
  { id: "Gut-friendly", label: "Gut-friendly", description: "Fibre and fermentation focused" },
  { id: "Low carb", label: "Low carb", description: "Lighter on starches" },
  { id: "High iron", label: "High iron", description: "Iron-rich ingredients" },
  { id: "Low fat", label: "Low fat", description: "Lighter, leaner choices" },
  { id: "Clean carb", label: "Clean carb", description: "Whole-food energy" },
  { id: "Indulgent", label: "Indulgent", description: "A comforting treat" },
];

export const TIME_FILTERS: ReadonlyArray<{ value: TimeFilter; label: string; detail: string }> = [
  { value: "30 min", label: "30 min", detail: "Quick" },
  { value: "1 hr", label: "1 hr", detail: "Standard" },
  { value: "2 hrs", label: "2 hrs", detail: "Relaxed" },
  { value: "All day", label: "All day", detail: "Slow cook" },
];

const CAPTURE_SESSION_KEY = "mise.capture-preferences.v1";

export function createDefaultCapturePreferences(): CapturePreferences {
  return { ingredients: [], healthGoals: ["High protein"], timeAvailable: "1 hr" };
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

export function selectTimeFilter(preferences: CapturePreferences, timeAvailable: string): CapturePreferences {
  const isSupported = TIME_AVAILABLE_OPTIONS.includes(timeAvailable as TimeFilter);
  return isSupported ? { ...preferences, timeAvailable: timeAvailable as TimeFilter } : preferences;
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
      ? parsed.healthGoals.filter((goal): goal is HealthGoalId => HEALTH_TAGS.includes(goal as HealthGoalId))
      : [];
    const validTime = TIME_AVAILABLE_OPTIONS.includes(parsed.timeAvailable as TimeFilter) ? parsed.timeAvailable as TimeFilter : "1 hr";
    const validIngredients = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.filter((ingredient): ingredient is string => typeof ingredient === "string" && ingredient.trim().length > 0)
      : [];
    return {
      ingredients: validIngredients,
      healthGoals: validGoals.length > 0 ? validGoals : ["High protein"],
      timeAvailable: validTime,
    };
  } catch {
    return createDefaultCapturePreferences();
  }
}

export function saveCapturePreferences(preferences: CapturePreferences): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CAPTURE_SESSION_KEY, JSON.stringify(preferences));
}
