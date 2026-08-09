import { z } from "zod";
import { RecipeSchema } from "./recipe";

export const MealLogInputSchema = z.object({
  recipe: RecipeSchema,
  servings: z.number().int().min(1).max(12),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().trim().max(1_000).optional(),
  cookedAt: z.number().int().positive().optional(),
}).strict();

export type MealLogInput = z.infer<typeof MealLogInputSchema>;
