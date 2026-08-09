import type { Recipe } from "@shared/recipe";

export type MealLogRecord = {
  id: string | number;
  recipe: Recipe;
  servings: number;
  rating: number | null;
  notes: string;
  cookedAt: number;
};

type RecordMealInput = Omit<MealLogRecord, "id" | "cookedAt"> & { cookedAt?: number };
export type RatingFilter = "all" | "five" | "four-plus" | "unrated";

export function isMealLogRecord(value: unknown): value is MealLogRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<MealLogRecord>;
  return (typeof record.id === "string" || typeof record.id === "number") && Boolean(record.recipe) && typeof record.servings === "number" && typeof record.cookedAt === "number" && typeof record.notes === "string";
}

export function mealRecordFromInput(input: RecordMealInput): MealLogRecord {
  return {
    ...input,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    cookedAt: input.cookedAt ?? Date.now(),
    notes: input.notes.trim(),
  };
}

export function appendMealRecord(records: MealLogRecord[], input: RecordMealInput): MealLogRecord[] {
  return [mealRecordFromInput(input), ...records].sort((a, b) => b.cookedAt - a.cookedAt).slice(0, 100);
}

function mealHistoryStorageKey(userId: string): string {
  return `mise.meal-history.v1.${userId}`;
}

export function loadMealHistory(userId: string): MealLogRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(mealHistoryStorageKey(userId)) || "[]") as MealLogRecord[];
    return Array.isArray(parsed) ? parsed.filter((record) => record && record.recipe && typeof record.cookedAt === "number") : [];
  } catch {
    return [];
  }
}

export function recordMeal(userId: string, input: RecordMealInput): MealLogRecord {
  const records = appendMealRecord(loadMealHistory(userId), input);
  const meal = records[0];
  window.localStorage.setItem(mealHistoryStorageKey(userId), JSON.stringify(records));
  return meal;
}

export function filterMealHistory(records: MealLogRecord[], search: string, rating: RatingFilter): MealLogRecord[] {
  const normalizedSearch = search.trim().toLowerCase();
  return records.filter((record) => {
    const matchesSearch = !normalizedSearch || `${record.recipe.name} ${record.recipe.tags.join(" ")} ${record.notes}`.toLowerCase().includes(normalizedSearch);
    const matchesRating = rating === "all" || (rating === "five" && record.rating === 5) || (rating === "four-plus" && (record.rating ?? 0) >= 4) || (rating === "unrated" && record.rating === null);
    return matchesSearch && matchesRating;
  });
}
