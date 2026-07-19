import { z } from "zod";

export const HEALTH_TAGS = [
  "High protein",
  "Gut-friendly",
  "Low carb",
  "High iron",
  "Low fat",
  "Clean carb",
  "Indulgent",
] as const;

export const TIME_AVAILABLE_OPTIONS = ["30 min", "1 hr", "2 hrs", "All day"] as const;

export type HealthTag = (typeof HEALTH_TAGS)[number];
export type TimeAvailable = (typeof TIME_AVAILABLE_OPTIONS)[number];

export const RecipeIngredientSchema = z.object({
  group: z.enum(["Protein", "Produce", "Pantry", "To buy"]),
  name: z.string().trim().min(1).max(120),
  qty: z.number().finite().nonnegative(),
  unit: z.string().trim().min(1).max(30).nullable(),
}).strict();

export const RecipeStepSchema = z.object({
  order: z.number().int().positive(),
  instruction: z.string().trim().min(1).max(1_000),
  timer_seconds: z.number().int().positive().nullable(),
}).strict();

export const RecipeSchema = z.object({
  name: z.string().trim().min(1).max(140),
  flavour: z.string().trim().min(1).max(280),
  total_time: z.string().trim().min(1).max(60),
  health_headline: z.string().trim().min(1).max(320),
  health_insights: z.array(z.string().trim().min(1).max(320)).min(2).max(3),
  tags: z.array(z.enum(HEALTH_TAGS)).min(1).max(HEALTH_TAGS.length),
  score: z.number().int().min(0).max(100),
  base_servings: z.number().int().min(1).max(20),
  missing_ingredients: z.array(z.string().trim().min(1).max(120)).max(20),
  ingredients: z.array(RecipeIngredientSchema).min(1).max(40),
  steps: z.array(RecipeStepSchema).min(1).max(20),
}).strict();

export const RecipeGenerationResponseSchema = z.object({
  recipes: z.array(RecipeSchema).min(4).max(6),
}).strict();

export const RecipeGenerationInputSchema = z.object({
  ingredients: z.array(z.string().trim().min(1).max(120)).min(1).max(60),
  healthGoals: z.array(z.enum(HEALTH_TAGS)).min(1).max(HEALTH_TAGS.length),
  timeAvailable: z.enum(TIME_AVAILABLE_OPTIONS),
  additionalNotes: z.string().trim().max(1_000).optional(),
  previousRecipeNames: z.array(z.string().trim().min(1).max(140)).max(20).optional(),
}).strict();

export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeGenerationResponse = z.infer<typeof RecipeGenerationResponseSchema>;
export type RecipeGenerationInput = z.infer<typeof RecipeGenerationInputSchema>;

/**
 * Native Gemini structured-output schema. The server also validates every
 * generated payload with the strict Zod schema above before returning it.
 */
export const GEMINI_RECIPE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    recipes: {
      type: "ARRAY",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          flavour: { type: "STRING" },
          total_time: { type: "STRING" },
          health_headline: { type: "STRING" },
          health_insights: { type: "ARRAY", items: { type: "STRING" }, minItems: 2, maxItems: 3 },
          tags: { type: "ARRAY", items: { type: "STRING", enum: HEALTH_TAGS }, minItems: 1, maxItems: HEALTH_TAGS.length },
          score: { type: "INTEGER", minimum: 0, maximum: 100 },
          base_servings: { type: "INTEGER", minimum: 1, maximum: 20 },
          missing_ingredients: { type: "ARRAY", items: { type: "STRING" } },
          ingredients: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                group: { type: "STRING", enum: ["Protein", "Produce", "Pantry", "To buy"] },
                name: { type: "STRING" },
                qty: { type: "NUMBER", minimum: 0 },
                unit: { type: "STRING", nullable: true },
              },
              required: ["group", "name", "qty", "unit"],
            },
          },
          steps: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                order: { type: "INTEGER", minimum: 1 },
                instruction: { type: "STRING" },
                timer_seconds: { type: "INTEGER", minimum: 1, nullable: true },
              },
              required: ["order", "instruction", "timer_seconds"],
            },
          },
        },
        required: ["name", "flavour", "total_time", "health_headline", "health_insights", "tags", "score", "base_servings", "missing_ingredients", "ingredients", "steps"],
      },
    },
  },
  required: ["recipes"],
};

export const RECIPE_GENERATION_SYSTEM_PROMPT = `You are a world-class chef and nutritionist. Generate exactly 4-6 recipes based on the user's available ingredients, health goals, time available and preferences.

Return ONLY valid JSON matching this exact schema — no markdown, no preamble:
{
  "recipes": [array of recipe objects]
}

Each recipe must include: name, flavour, total_time, health_headline, health_insights (array of 2-3 strings), tags (from approved list only), score (0-100 personalised match), base_servings, missing_ingredients (ingredients NOT in the user's list), ingredients (array with group/name/qty/unit), steps (array with order/instruction/timer_seconds).

Rules:
- Prioritise recipes that use the available ingredients with minimal extras needed
- Score higher when fewer ingredients are missing
- health_headline must be one punchy sentence explaining the nutritional benefit
- health_insights must be 2-3 specific ingredient-level insights
- timer_seconds only on steps that involve waiting or cooking (null otherwise)
- Ingredient groups: Protein, Produce, Pantry, To buy (for missing items only)
- All quantities must be precise and scaled to base_servings
- Recipes must match ALL of the user's health goals
- Total time must be realistic including prep`;

export function buildRecipeGenerationPrompt(input: RecipeGenerationInput): string {
  return [
    `Ingredients I have: ${input.ingredients.join(", ")}`,
    `Health goals: ${input.healthGoals.join(", ")}`,
    `Time available: ${input.timeAvailable}`,
    `Additional notes: ${input.additionalNotes?.trim() || "None"}`,
    `Previous recipes to avoid repeating: ${input.previousRecipeNames?.join(", ") || "None"}`,
  ].join("\n");
}
