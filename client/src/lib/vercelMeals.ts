import { shouldUseVercelRecipeEndpoint } from "./vercelRecipes";
import type { MealLogRecord } from "./mealHistory";
import type { Recipe } from "@shared/recipe";
import { supabase } from "./supabase";

const VERCEL_MEALS_ENDPOINT = "/api/meals";

async function authorizationHeader(): Promise<Record<string, string>> {
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  if (!data.session?.access_token) throw new Error("Please sign in to access meal history.");
  return { authorization: `Bearer ${data.session.access_token}` };
}

async function responsePayload(response: Response): Promise<unknown> {
  const text = await response.text();
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown } }).error;
    if (typeof error?.message === "string") return error.message;
  }
  return fallback;
}

export function shouldUseVercelMealsEndpoint(): boolean {
  return shouldUseVercelRecipeEndpoint();
}

export async function listMealsOnVercel(): Promise<MealLogRecord[]> {
  const response = await fetch(VERCEL_MEALS_ENDPOINT, { headers: await authorizationHeader() });
  const payload = await responsePayload(response);
  if (!response.ok) throw new Error(errorMessage(payload, "We could not load your meal history right now."));
  const meals = payload && typeof payload === "object" ? (payload as { meals?: unknown }).meals : null;
  if (!Array.isArray(meals)) throw new Error("The meal history service returned an unexpected response.");
  return meals as MealLogRecord[];
}

export async function saveMealOnVercel(input: { recipe: Recipe; servings: number; rating: number | null; notes: string }): Promise<void> {
  const response = await fetch(VERCEL_MEALS_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authorizationHeader()) },
    body: JSON.stringify(input),
  });
  const payload = await responsePayload(response);
  if (!response.ok) throw new Error(errorMessage(payload, "We could not save that meal right now."));
}
