import { appendMealRecord, isMealLogRecord, type MealLogRecord, type RecordMealInput } from "./mealHistory";
import { supabase } from "./supabase";

export const SUPABASE_MEAL_HISTORY_KEY = "miseMealHistory";
const MAX_ACCOUNT_MEALS = 24;

export function accountMealHistoryFromMetadata(metadata: unknown): MealLogRecord[] {
  if (!metadata || typeof metadata !== "object") return [];
  const stored = (metadata as Record<string, unknown>)[SUPABASE_MEAL_HISTORY_KEY];
  if (!Array.isArray(stored)) return [];
  return stored.filter(isMealLogRecord).sort((a, b) => b.cookedAt - a.cookedAt).slice(0, MAX_ACCOUNT_MEALS);
}

function configuredClient() {
  if (!supabase) throw new Error("Account history is unavailable until Supabase is configured.");
  return supabase;
}

export async function loadAccountMealHistory(): Promise<MealLogRecord[]> {
  const client = configuredClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Please sign in to access meal history.");
  return accountMealHistoryFromMetadata(data.user.user_metadata);
}

export async function saveAccountMealHistory(input: RecordMealInput): Promise<MealLogRecord> {
  const client = configuredClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Please sign in to save meal history.");

  const records = appendMealRecord(accountMealHistoryFromMetadata(data.user.user_metadata), input).slice(0, MAX_ACCOUNT_MEALS);
  const { error: updateError } = await client.auth.updateUser({
    data: { ...data.user.user_metadata, [SUPABASE_MEAL_HISTORY_KEY]: records },
  });
  if (updateError) throw new Error(updateError.message);
  return records[0];
}
