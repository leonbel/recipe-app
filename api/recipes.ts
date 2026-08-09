const HEALTH_TAGS = ["High protein", "Gut-friendly", "Low carb", "High iron", "Low fat", "Clean carb", "Indulgent"] as const;
const TIME_AVAILABLE_OPTIONS = ["30 min", "1 hr", "2 hrs", "All day"] as const;
const INGREDIENT_GROUPS = ["Protein", "Produce", "Pantry", "To buy"] as const;
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type HealthTag = (typeof HEALTH_TAGS)[number];
type TimeAvailable = (typeof TIME_AVAILABLE_OPTIONS)[number];
type IngredientGroup = (typeof INGREDIENT_GROUPS)[number];

type RecipeGenerationInput = {
  ingredients: string[];
  healthGoals: HealthTag[];
  timeAvailable: TimeAvailable;
  additionalNotes?: string;
  previousRecipeNames?: string[];
};

type RecipeIngredient = { group: IngredientGroup; name: string; qty: number; unit: string | null };
type RecipeStep = { order: number; instruction: string; timer_seconds: number | null };
type Recipe = {
  name: string;
  flavour: string;
  total_time: string;
  health_headline: string;
  health_insights: string[];
  tags: HealthTag[];
  score: number;
  base_servings: number;
  missing_ingredients: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};
type RecipeGenerationResponse = { recipes: Recipe[] };
type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { setHeader(name: string, value: string): void; status(code: number): VercelResponse; json(body: unknown): void };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

export const config = { maxDuration: 30 };

const RECIPE_GENERATION_SYSTEM_PROMPT = `You are a world-class chef and nutritionist. Generate exactly 4-6 recipes based on the user's available ingredients, health goals, time available and preferences.

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

const GEMINI_RECIPE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    recipes: {
      type: "ARRAY",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" }, flavour: { type: "STRING" }, total_time: { type: "STRING" }, health_headline: { type: "STRING" },
          health_insights: { type: "ARRAY", items: { type: "STRING" }, minItems: 2, maxItems: 3 },
          tags: { type: "ARRAY", items: { type: "STRING", enum: HEALTH_TAGS }, minItems: 1, maxItems: HEALTH_TAGS.length },
          score: { type: "INTEGER", minimum: 0, maximum: 100 }, base_servings: { type: "INTEGER", minimum: 1, maximum: 20 },
          missing_ingredients: { type: "ARRAY", items: { type: "STRING" } },
          ingredients: {
            type: "ARRAY",
            items: { type: "OBJECT", properties: {
              group: { type: "STRING", enum: INGREDIENT_GROUPS }, name: { type: "STRING" }, qty: { type: "NUMBER", minimum: 0 }, unit: { type: "STRING", nullable: true },
            }, required: ["group", "name", "qty", "unit"] },
          },
          steps: {
            type: "ARRAY",
            items: { type: "OBJECT", properties: {
              order: { type: "INTEGER", minimum: 1 }, instruction: { type: "STRING" }, timer_seconds: { type: "INTEGER", minimum: 1, nullable: true },
            }, required: ["order", "instruction", "timer_seconds"] },
          },
        },
        required: ["name", "flavour", "total_time", "health_headline", "health_insights", "tags", "score", "base_servings", "missing_ingredients", "ingredients", "steps"],
      },
    },
  },
  required: ["recipes"],
};

const FALLBACK_RECIPES: RecipeGenerationResponse = {
  recipes: [
    {
      name: "Moroccan Chicken Tagine", flavour: "Warm saffron, sweet apricot, olive, and lemon-spiced chicken.", total_time: "1 hr 10 min",
      health_headline: "Chicken and chickpeas create a fragrant, filling meal with protein and fibre.",
      health_insights: ["Chicken provides complete protein.", "Chickpeas contribute gut-supporting fibre.", "Warm spices add depth without a heavy sauce."],
      tags: ["High protein", "Gut-friendly", "High iron"], score: 94, base_servings: 4, missing_ingredients: ["Dried apricots", "Green olives", "Preserved lemon"],
      ingredients: [
        { group: "Protein", name: "Chicken thighs", qty: 700, unit: "g" }, { group: "Protein", name: "Chickpeas", qty: 400, unit: "g can" },
        { group: "Produce", name: "Onion", qty: 1, unit: null }, { group: "Produce", name: "Carrot", qty: 2, unit: null },
        { group: "Pantry", name: "Ground cumin", qty: 2, unit: "tsp" }, { group: "Pantry", name: "Chicken stock", qty: 500, unit: "ml" },
        { group: "To buy", name: "Dried apricots", qty: 80, unit: "g" }, { group: "To buy", name: "Green olives", qty: 80, unit: "g" }, { group: "To buy", name: "Preserved lemon", qty: 0.5, unit: null },
      ],
      steps: [
        { order: 1, instruction: "Season and brown the chicken in a heavy pot, then transfer it to a plate.", timer_seconds: 480 },
        { order: 2, instruction: "Soften onion and carrot, then stir through cumin for one minute.", timer_seconds: 420 },
        { order: 3, instruction: "Add chicken, chickpeas, stock, apricots, olives, and lemon. Cover and simmer gently.", timer_seconds: 2100 },
        { order: 4, instruction: "Taste, adjust seasoning, and serve warm.", timer_seconds: null },
      ],
    },
    {
      name: "Spanish Chicken and Chickpea", flavour: "Smoky paprika chicken with sweet tomato, pepper, and tender chickpeas.", total_time: "45 min",
      health_headline: "A protein-forward skillet meal with fibre-rich chickpeas and iron-containing spinach.",
      health_insights: ["Chicken and chickpeas combine animal and plant protein.", "Spinach contributes iron alongside vitamin-C-rich tomato.", "Smoked paprika delivers depth without excess oil."],
      tags: ["High protein", "Gut-friendly", "High iron", "Low fat"], score: 92, base_servings: 4, missing_ingredients: ["Smoked paprika", "Chicken stock"],
      ingredients: [
        { group: "Protein", name: "Chicken breast", qty: 650, unit: "g" }, { group: "Protein", name: "Chickpeas", qty: 400, unit: "g can" },
        { group: "Produce", name: "Red bell pepper", qty: 1, unit: null }, { group: "Produce", name: "Tomatoes", qty: 400, unit: "g" }, { group: "Produce", name: "Spinach", qty: 120, unit: "g" },
        { group: "Pantry", name: "Olive oil", qty: 1, unit: "tbsp" }, { group: "To buy", name: "Smoked paprika", qty: 2, unit: "tsp" }, { group: "To buy", name: "Chicken stock", qty: 250, unit: "ml" },
      ],
      steps: [
        { order: 1, instruction: "Sear seasoned chicken pieces until golden and set aside.", timer_seconds: 420 },
        { order: 2, instruction: "Cook pepper with smoked paprika until fragrant.", timer_seconds: 300 },
        { order: 3, instruction: "Add tomatoes, chickpeas, stock, and chicken. Simmer until thick and cooked through.", timer_seconds: 900 },
        { order: 4, instruction: "Fold in spinach just until wilted.", timer_seconds: 60 },
      ],
    },
    {
      name: "Tuscan Braised Chicken", flavour: "Garlic, tomato, rosemary, and cannellini beans in a rustic Tuscan braise.", total_time: "1 hr 20 min",
      health_headline: "Chicken and beans make a hearty protein-rich braise with slow-release energy.",
      health_insights: ["Cannellini beans provide satisfying dietary fibre.", "Tomatoes add bright acidity and lycopene.", "Olive oil carries flavour without a cream-based sauce."],
      tags: ["High protein", "Gut-friendly", "Clean carb"], score: 89, base_servings: 4, missing_ingredients: ["Cannellini beans", "Fresh rosemary"],
      ingredients: [
        { group: "Protein", name: "Chicken thighs", qty: 700, unit: "g" }, { group: "Protein", name: "Cannellini beans", qty: 400, unit: "g can" },
        { group: "Produce", name: "Onion", qty: 1, unit: null }, { group: "Produce", name: "Cherry tomatoes", qty: 350, unit: "g" },
        { group: "Pantry", name: "Tomato paste", qty: 1, unit: "tbsp" }, { group: "Pantry", name: "Chicken stock", qty: 400, unit: "ml" },
        { group: "To buy", name: "Cannellini beans", qty: 400, unit: "g can" }, { group: "To buy", name: "Fresh rosemary", qty: 2, unit: "sprigs" },
      ],
      steps: [
        { order: 1, instruction: "Brown the chicken in a Dutch oven, then set it aside.", timer_seconds: 600 },
        { order: 2, instruction: "Cook onion and tomato paste until aromatic.", timer_seconds: 300 },
        { order: 3, instruction: "Add tomatoes, stock, beans, rosemary, and chicken. Cover and braise gently.", timer_seconds: 2700 },
        { order: 4, instruction: "Rest briefly, then serve the chicken with beans and sauce.", timer_seconds: 300 },
      ],
    },
    {
      name: "Indian Butter Chicken", flavour: "Velvety tomato, ginger, and garam masala sauce around tender spiced chicken.", total_time: "50 min",
      health_headline: "A comforting high-protein dinner made lighter with yogurt and a measured butter finish.",
      health_insights: ["Chicken makes this a satisfying protein-rich centrepiece.", "Greek yogurt adds creaminess and extra protein.", "Tomato and spices build richness with less added fat."],
      tags: ["High protein", "Indulgent", "Low fat"], score: 91, base_servings: 4, missing_ingredients: ["Garam masala", "Greek yogurt", "Butter"],
      ingredients: [
        { group: "Protein", name: "Chicken breast", qty: 700, unit: "g" }, { group: "Produce", name: "Onion", qty: 1, unit: null }, { group: "Produce", name: "Fresh ginger", qty: 25, unit: "g" },
        { group: "Pantry", name: "Crushed tomatoes", qty: 400, unit: "g" }, { group: "Pantry", name: "Ground cumin", qty: 1, unit: "tsp" },
        { group: "To buy", name: "Garam masala", qty: 2, unit: "tsp" }, { group: "To buy", name: "Greek yogurt", qty: 180, unit: "g" }, { group: "To buy", name: "Butter", qty: 20, unit: "g" },
      ],
      steps: [
        { order: 1, instruction: "Season chicken and sear until lightly charred, then set it aside.", timer_seconds: 480 },
        { order: 2, instruction: "Cook onion and ginger, then add tomatoes and spices to make a thick sauce.", timer_seconds: 600 },
        { order: 3, instruction: "Return chicken to the sauce and simmer until cooked through.", timer_seconds: 600 },
        { order: 4, instruction: "Take off the heat, stir in yogurt and butter, then serve.", timer_seconds: null },
      ],
    },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function readString(value: unknown, maxLength: number, allowEmpty = false): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return (allowEmpty || normalized.length > 0) && normalized.length <= maxLength ? normalized : null;
}

function parseBody(body: unknown): unknown {
  if (typeof body !== "string") return body;
  try { return JSON.parse(body); } catch { return undefined; }
}

function parseInput(value: unknown): RecipeGenerationInput | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["ingredients", "healthGoals", "timeAvailable", "additionalNotes", "previousRecipeNames"])) return null;
  if (!Array.isArray(value.ingredients) || value.ingredients.length < 1 || value.ingredients.length > 60) return null;
  if (!Array.isArray(value.healthGoals) || value.healthGoals.length < 1 || value.healthGoals.length > HEALTH_TAGS.length) return null;
  if (typeof value.timeAvailable !== "string" || !TIME_AVAILABLE_OPTIONS.includes(value.timeAvailable as TimeAvailable)) return null;
  const ingredients = value.ingredients.map((ingredient) => readString(ingredient, 120));
  const healthGoals = value.healthGoals.map((goal) => typeof goal === "string" && HEALTH_TAGS.includes(goal as HealthTag) ? goal as HealthTag : null);
  if (ingredients.some((ingredient) => ingredient === null) || healthGoals.some((goal) => goal === null)) return null;
  const additionalNotes = value.additionalNotes === undefined ? undefined : readString(value.additionalNotes, 1000, true);
  if (additionalNotes === null) return null;
  let previousRecipeNames: string[] | undefined;
  if (value.previousRecipeNames !== undefined) {
    if (!Array.isArray(value.previousRecipeNames) || value.previousRecipeNames.length > 20) return null;
    const names = value.previousRecipeNames.map((name) => readString(name, 140));
    if (names.some((name) => name === null)) return null;
    previousRecipeNames = names as string[];
  }
  return { ingredients: ingredients as string[], healthGoals: healthGoals as HealthTag[], timeAvailable: value.timeAvailable as TimeAvailable, additionalNotes, previousRecipeNames };
}

function parseIngredient(value: unknown): RecipeIngredient | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["group", "name", "qty", "unit"]) || typeof value.group !== "string" || !INGREDIENT_GROUPS.includes(value.group as IngredientGroup)) return null;
  const name = readString(value.name, 120);
  const unit = value.unit === null ? null : readString(value.unit, 30);
  if (!name || unit === null && value.unit !== null || typeof value.qty !== "number" || !Number.isFinite(value.qty) || value.qty < 0) return null;
  return { group: value.group as IngredientGroup, name, qty: value.qty, unit };
}

function parseStep(value: unknown): RecipeStep | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["order", "instruction", "timer_seconds"]) || !Number.isInteger(value.order) || (value.order as number) < 1) return null;
  const instruction = readString(value.instruction, 1_000);
  const timer = value.timer_seconds;
  if (!instruction || (timer !== null && (!Number.isInteger(timer) || (timer as number) < 1))) return null;
  return { order: value.order as number, instruction, timer_seconds: timer as number | null };
}

function parseRecipe(value: unknown): Recipe | null {
  const keys = ["name", "flavour", "total_time", "health_headline", "health_insights", "tags", "score", "base_servings", "missing_ingredients", "ingredients", "steps"];
  if (!isRecord(value) || !hasOnlyKeys(value, keys)) return null;
  const name = readString(value.name, 140); const flavour = readString(value.flavour, 280); const totalTime = readString(value.total_time, 60); const headline = readString(value.health_headline, 320);
  if (!name || !flavour || !totalTime || !headline || !Array.isArray(value.health_insights) || value.health_insights.length < 2 || value.health_insights.length > 3 || !Array.isArray(value.tags) || value.tags.length < 1 || value.tags.length > HEALTH_TAGS.length || !Array.isArray(value.missing_ingredients) || value.missing_ingredients.length > 20 || !Array.isArray(value.ingredients) || value.ingredients.length < 1 || value.ingredients.length > 40 || !Array.isArray(value.steps) || value.steps.length < 1 || value.steps.length > 20 || !Number.isInteger(value.score) || (value.score as number) < 0 || (value.score as number) > 100 || !Number.isInteger(value.base_servings) || (value.base_servings as number) < 1 || (value.base_servings as number) > 20) return null;
  const insights = value.health_insights.map((insight) => readString(insight, 320));
  const tags = value.tags.map((tag) => typeof tag === "string" && HEALTH_TAGS.includes(tag as HealthTag) ? tag as HealthTag : null);
  const missing = value.missing_ingredients.map((ingredient) => readString(ingredient, 120));
  const ingredients = value.ingredients.map(parseIngredient); const steps = value.steps.map(parseStep);
  if (insights.some((item) => item === null) || tags.some((item) => item === null) || missing.some((item) => item === null) || ingredients.some((item) => item === null) || steps.some((item) => item === null)) return null;
  return { name, flavour, total_time: totalTime, health_headline: headline, health_insights: insights as string[], tags: tags as HealthTag[], score: value.score as number, base_servings: value.base_servings as number, missing_ingredients: missing as string[], ingredients: ingredients as RecipeIngredient[], steps: steps as RecipeStep[] };
}

function parseRecipeResponse(value: unknown): RecipeGenerationResponse | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["recipes"]) || !Array.isArray(value.recipes) || value.recipes.length < 4 || value.recipes.length > 6) return null;
  const recipes = value.recipes.map(parseRecipe);
  return recipes.some((recipe) => recipe === null) ? null : { recipes: recipes as Recipe[] };
}

function buildPrompt(input: RecipeGenerationInput): string {
  return [`Ingredients I have: ${input.ingredients.join(", ")}`, `Health goals: ${input.healthGoals.join(", ")}`, `Time available: ${input.timeAvailable}`, `Additional notes: ${input.additionalNotes || "None"}`, `Previous recipes to avoid repeating: ${input.previousRecipeNames?.join(", ") || "None"}`].join("\n");
}

function parseGeminiJson(value: string): unknown {
  return JSON.parse(value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
}

async function generateFromGemini(input: RecipeGenerationInput): Promise<RecipeGenerationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured");
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: RECIPE_GENERATION_SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: GEMINI_RECIPE_RESPONSE_SCHEMA, temperature: 0.7, maxOutputTokens: 8_192 },
    }),
  });
  if (!response.ok) throw new Error("Gemini generation failed");
  const payload = await response.json() as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned no recipe content");
  const recipes = parseRecipeResponse(parseGeminiJson(text));
  if (!recipes) throw new Error("Gemini returned an invalid recipe response");
  return recipes;
}

/** Exported for contract tests; it relies on no imports or external project modules. */
export function createFallbackRecipeResponse(): RecipeGenerationResponse {
  const clone = JSON.parse(JSON.stringify(FALLBACK_RECIPES)) as unknown;
  const recipes = parseRecipeResponse(clone);
  if (!recipes) throw new Error("Embedded fallback contract is invalid");
  return recipes;
}

function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.status(status).json(body);
}

/** Self-contained Vercel serverless route with no runtime imports from this project. */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for recipe generation." } });
    return;
  }
  const input = parseInput(parseBody(request.body));
  if (!input) {
    sendJson(response, 400, { error: { code: "INVALID_RECIPE_REQUEST", message: "Provide at least one ingredient, one approved health goal, and a valid time option." } });
    return;
  }
  try {
    sendJson(response, 200, await generateFromGemini(input));
  } catch {
    // Gemini provider, quota, parsing, schema, and network failures are intentionally transparent to the user.
    sendJson(response, 200, createFallbackRecipeResponse());
  }
}
