import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, mealLogs, users } from "../drizzle/schema";
import { MealLogInputSchema, type MealLogInput } from "../shared/mealLog";
import { RecipeSchema } from "../shared/recipe";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createMealLog(userId: number, input: MealLogInput) {
  const db = await getDb();
  if (!db) throw new Error("Meal history is not available right now.");

  const normalized = MealLogInputSchema.parse(input);
  const cookedAt = normalized.cookedAt ? new Date(normalized.cookedAt) : new Date();
  const recipeId = normalized.recipe.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const result = await db.insert(mealLogs).values({
    userId,
    recipeId,
    recipeName: normalized.recipe.name,
    recipeData: JSON.stringify(normalized.recipe),
    servings: normalized.servings,
    rating: normalized.rating ?? null,
    notes: normalized.notes?.trim() || null,
    cookedAt,
  });

  return {
    id: Number(result[0].insertId),
    recipeId,
    recipeName: normalized.recipe.name,
    servings: normalized.servings,
    rating: normalized.rating ?? null,
    notes: normalized.notes?.trim() || null,
    cookedAt: cookedAt.getTime(),
  };
}

export async function listMealLogs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Meal history is not available right now.");

  const records = await db.select().from(mealLogs).where(eq(mealLogs.userId, userId)).orderBy(desc(mealLogs.cookedAt));
  return records.map((record) => ({
    id: record.id,
    recipeId: record.recipeId,
    recipeName: record.recipeName,
    recipe: RecipeSchema.parse(JSON.parse(record.recipeData)),
    servings: record.servings,
    rating: record.rating,
    notes: record.notes,
    cookedAt: record.cookedAt.getTime(),
  }));
}
