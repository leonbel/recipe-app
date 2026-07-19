import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildRecipeGenerationPrompt,
  RecipeGenerationResponseSchema,
  type RecipeGenerationInput,
} from "@shared/recipe";
import { generateRecipeOptions } from "./recipeGeneration";

const input: RecipeGenerationInput = {
  ingredients: ["Chicken breast", "Spinach", "Tomatoes"],
  healthGoals: ["High protein", "Gut-friendly"],
  timeAvailable: "1 hr",
  previousRecipeNames: ["Chicken salad"],
};

function recipe(index: number) {
  return {
    name: `Recipe ${index}`,
    flavour: "Bright, herby and satisfying",
    total_time: "35 min",
    health_headline: "Protein and fibre make this a balanced, sustaining meal.",
    health_insights: ["Chicken provides complete protein.", "Spinach contributes folate and iron."],
    tags: ["High protein", "Gut-friendly"],
    score: 88,
    base_servings: 2,
    missing_ingredients: ["Lemon"],
    ingredients: [{ group: "Protein", name: "Chicken breast", qty: 300, unit: "g" }],
    steps: [{ order: 1, instruction: "Cook the chicken until cooked through.", timer_seconds: 480 }],
  };
}

describe("recipe generation contract", () => {
  it("builds the exact user-message sections from capture preferences", () => {
    const prompt = buildRecipeGenerationPrompt(input);
    expect(prompt).toContain("Ingredients I have: Chicken breast, Spinach, Tomatoes");
    expect(prompt).toContain("Health goals: High protein, Gut-friendly");
    expect(prompt).toContain("Time available: 1 hr");
    expect(prompt).toContain("Additional notes: None");
    expect(prompt).toContain("Previous recipes to avoid repeating: Chicken salad");
  });

  it("accepts four to six fully shaped recipes and rejects unapproved health tags", () => {
    const valid = { recipes: [recipe(1), recipe(2), recipe(3), recipe(4)] };
    expect(RecipeGenerationResponseSchema.parse(valid).recipes).toHaveLength(4);

    const invalid = structuredClone(valid);
    invalid.recipes[0].tags = ["Balanced"];
    expect(() => RecipeGenerationResponseSchema.parse(invalid)).toThrow();
  });
});

describe("native Gemini recipe generation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends the requested model structured-output configuration and validates the returned recipes", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const responseBody = { candidates: [{ content: { parts: [{ text: JSON.stringify({ recipes: [recipe(1), recipe(2), recipe(3), recipe(4)] }) }] } }] };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(responseBody), { status: 200 }));

    const result = await generateRecipeOptions(input);

    expect(result.recipes).toHaveLength(4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("models/gemini-2.0-flash:generateContent");
    expect(request.headers).toMatchObject({ "x-goog-api-key": "test-key" });
    const payload = JSON.parse(String(request.body));
    expect(payload.generationConfig).toMatchObject({ responseMimeType: "application/json" });
    expect(payload.generationConfig.responseSchema.required).toEqual(["recipes"]);
    expect(payload.systemInstruction.parts[0].text).toContain("Generate exactly 4-6 recipes");
  });

  it("returns a user-safe action message when the API key has no generation quota", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("quota unavailable", { status: 429 }));

    await expect(generateRecipeOptions(input)).rejects.toThrow(/no recipe-generation quota available yet/i);
  });
});
